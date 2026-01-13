import express from "express";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { creerNotification } from "../notifications/notifications.service.js";
import { obtenirCompteurNotifications } from "../notifications/notifications.service.js";

export const routesPosts = express.Router();

//////////
// Charge le feed avec posts triés par scoring intelligent
// Filtre les posts selon la visibility et les intérêts
// Retourne: objet { utilisateur, publications, debug, compteurNotifications }
//////////
routesPosts.get("/feed", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateur = requete.user.id;
  const affichageDebug = requete.query.debug === "1" || requete.query.debug === "true";

  // 1) Récupérer les utilisateurs que je suis
  const abonnementsData = await query(
    "SELECT followedId FROM Follow WHERE followerId = ?",
    [idUtilisateur]
  );
  const idsAbonnes = abonnementsData.map(f => f.followedId);
  const ensembleAbonnes = new Set(idsAbonnes);

  // 2) Récupérer les mutuals (follow bidirectionnel)
  const mutuelsData = idsAbonnes.length > 0
    ? await query(
        `SELECT followerId FROM Follow WHERE followedId = ? AND followerId IN (${idsAbonnes.map(() => '?').join(',')})`,
        [idUtilisateur, ...idsAbonnes]
      )
    : [];
  const idsAmis = mutuelsData.map(m => m.followerId);
  const ensembleAmis = new Set(idsAmis);

  // 3) Récupérer mes intérêts
  const mesInterets = await query(
    "SELECT interestId FROM UserInterest WHERE userId = ?",
    [idUtilisateur]
  );
  const ensembleInterets = new Set(mesInterets.map(x => x.interestId));

  // 4) Récupérer mes memberships de groupes
  const adhesions = await query(
    "SELECT groupId FROM GroupMember WHERE userId = ?",
    [idUtilisateur]
  );
  const idsGroupes = adhesions.map(m => m.groupId);

  // 4b) Récupérer les utilisateurs que je bloque ou que j'ai mute
  const utilisateursBloquesData = await query(
    "SELECT blockedId FROM UserBlock WHERE blockerId = ?",
    [idUtilisateur]
  );
  const idsBloque = utilisateursBloquesData.map(b => b.blockedId);

  const utilisateursMutesData = await query(
    "SELECT mutedId FROM UserMute WHERE muterId = ?",
    [idUtilisateur]
  );
  const idsMute = utilisateursMutesData.map(m => m.mutedId);

  const idsUtilisateursFiltres = [...new Set([...idsBloque, ...idsMute])];

  // 5) Construire la clause WHERE SQL pour les permissions
  let clausesOu = [];
  let parametresSql = [];

  clausesOu.push("p.authorId = ?");
  parametresSql.push(idUtilisateur);

  clausesOu.push("p.visibility = 'PUBLIC'");

  if (idsAbonnes.length > 0) {
    clausesOu.push(`(p.visibility = 'FOLLOWERS' AND p.authorId IN (${idsAbonnes.map(() => '?').join(',')}))`);
    parametresSql.push(...idsAbonnes);
  }

  if (idsAmis.length > 0) {
    clausesOu.push(`(p.visibility = 'FRIENDS' AND p.authorId IN (${idsAmis.map(() => '?').join(',')}))`);
    parametresSql.push(...idsAmis);
  }

  if (idsGroupes.length > 0) {
    clausesOu.push(`p.groupId IN (${idsGroupes.map(() => '?').join(',')})`);
    parametresSql.push(...idsGroupes);
  }

  let clauseFiltre = "";
  let parametresFiltre = [];
  
  // Exclure les posts de groupe où je ne suis pas membre
  if (idsGroupes.length > 0) {
    clauseFiltre = ` AND (p.groupId IS NULL OR p.groupId IN (${idsGroupes.map(() => '?').join(',')}))`;
    parametresFiltre = idsGroupes;
  } else {
    // Si je n'appartiens à aucun groupe, exclure tous les posts de groupe
    clauseFiltre = " AND p.groupId IS NULL";
  }
  
  if (idsUtilisateursFiltres.length > 0) {
    clauseFiltre += ` AND p.authorId NOT IN (${idsUtilisateursFiltres.map(() => '?').join(',')})`;
    parametresFiltre.push(...idsUtilisateursFiltres);
  }

  const sqlWhere = clausesOu.length > 0 ? `WHERE (${clausesOu.join(' OR ')})${clauseFiltre}` : '';
  parametresSql.push(...parametresFiltre);

  // 6) Récupérer tous les posts visibles
  const donneesPublications = await query(`
    SELECT
      p.*,
      u.id as author_id,
      u.displayName as author_displayName,
      g.id as group_id,
      g.name as group_name,
      (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id) as likes_count,
      (SELECT COUNT(*) FROM Comment WHERE postId = p.id) as comments_count
    FROM Post p
    LEFT JOIN User u ON p.authorId = u.id
    LEFT JOIN \`Group\` g ON p.groupId = g.id
    ${sqlWhere}
    ORDER BY p.createdAt DESC
    LIMIT 80
  `, parametresSql);

  // Récupérer les likes et commentaires
  const idsPublications = donneesPublications.map(p => p.id);
  const likes = idsPublications.length > 0 ? await query(`
    SELECT postId, userId FROM \`Like\` WHERE postId IN (${idsPublications.map(() => '?').join(',')})
  `, idsPublications) : [];

  const commentaires = idsPublications.length > 0 ? await query(`
    SELECT
      c.*,
      u.id as user_id,
      u.displayName as user_displayName
    FROM Comment c
    JOIN User u ON c.userId = u.id
    WHERE c.postId IN (${idsPublications.map(() => '?').join(',')})
    ORDER BY c.createdAt DESC
  `, idsPublications) : [];

  // 7) Mapper les données brutes en publications
  const publicationsBrutes = donneesPublications.map(p => ({
    id: p.id,
    content: p.content,
    visibility: p.visibility,
    authorId: p.authorId,
    groupId: p.group_id,
    createdAt: p.createdAt,
    author: {
      id: p.author_id,
      displayName: p.author_displayName
    },
    group: p.group_id ? {
      id: p.group_id,
      name: p.group_name
    } : null,
    likes: likes.filter(l => l.postId === p.id).map(l => ({ userId: l.userId })),
    comments: commentaires
      .filter(c => c.postId === p.id)
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        content: c.content,
        postId: c.postId,
        userId: c.userId,
        createdAt: c.createdAt,
        user: {
          id: c.user_id,
          displayName: c.user_displayName
        }
      })),
    _count: {
      likes: p.likes_count,
      comments: p.comments_count
    }
  }));

  // 8) Récupérer les intérêts des auteurs (N+1 optimisé)
  const idsAuteurs = [...new Set(publicationsBrutes.map(p => p.authorId))];
  const interetsAuteurs = idsAuteurs.length > 0
    ? await query(`
        SELECT userId, interestId FROM UserInterest WHERE userId IN (${idsAuteurs.map(() => '?').join(',')})
      `, idsAuteurs)
    : [];

  const interetsParUtilisateur = new Map();
  for (const row of interetsAuteurs) {
    if (!interetsParUtilisateur.has(row.userId)) interetsParUtilisateur.set(row.userId, new Set());
    interetsParUtilisateur.get(row.userId).add(row.interestId);
  }

  const instantActuel = Date.now();

  function compterInteretsCommunsAvec(idAuteur) {
    const ensembleAuteur = interetsParUtilisateur.get(idAuteur);
    if (!ensembleAuteur || ensembleInterets.size === 0) return 0;

    let comptage = 0;
    const [petit, grand] =
      ensembleInterets.size <= ensembleAuteur.size ? [ensembleInterets, ensembleAuteur] : [ensembleAuteur, ensembleInterets];

    for (const id of petit) if (grand.has(id)) comptage++;
    return comptage;
  }

  function calculerDetailsScore(publication) {
    let scoreRelation = 0;
    const bonusGroupe = publication.groupId && idsGroupes.includes(publication.groupId) ? 20 : 0;

    if (publication.authorId === idUtilisateur) scoreRelation = 100;
    else if (ensembleAmis.has(publication.authorId)) scoreRelation = 60;
    else if (ensembleAbonnes.has(publication.authorId)) scoreRelation = 30;
    else scoreRelation = 10;

    const interetsCommuns = compterInteretsCommunsAvec(publication.authorId);
    const scoreInterets = interetsCommuns * 6;

    const heuresEcoulees = (instantActuel - new Date(publication.createdAt).getTime()) / (1000 * 60 * 60);
    const scoreRecence = Math.max(0, 40 - heuresEcoulees);

    const nbLikes = publication._count?.likes ?? publication.likes?.length ?? 0;
    const nbCommentaires = publication._count?.comments ?? 0;
    const scoreEngagement = Math.min(12, nbLikes) + Math.min(12, nbCommentaires);

    const penalitePrive = publication.visibility === "PRIVATE" && publication.authorId !== idUtilisateur ? -9999 : 0;

    const scoreTotal = scoreRelation + scoreInterets + scoreRecence + scoreEngagement + bonusGroupe + penalitePrive;

    return {
      scoreTotal,
      scoreRelation,
      interetsCommuns,
      scoreInterets,
      heuresEcoulees,
      scoreRecence,
      nbLikes,
      nbCommentaires,
      scoreEngagement,
      bonusGroupe
    };
  }

  const publications = publicationsBrutes
    .map(p => {
      const details = calculerDetailsScore(p);
      return affichageDebug
        ? { ...p, score: details.scoreTotal, debugScore: details }
        : { ...p, score: details.scoreTotal };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  const resultatCompteur = await queryOne(
    "SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL",
    [idUtilisateur]
  );
  const compteurNotifications = resultatCompteur ? resultatCompteur.count : 0;
  reponse.render("feed/index", { user: requete.user, posts: publications, debug: affichageDebug, unreadCount: compteurNotifications });
});

//////////
// Crée un nouveau post avec visibility
// Filtre et valide le contenu et la visibilité
// Retourne: redirect /posts/feed
//////////
routesPosts.post("/", exigerAuthentification, async (requete, reponse) => {
  const contenu = (requete.body?.content || "").trim();
  const visibilite = (requete.body?.visibility || "PUBLIC").toUpperCase();

  const visibiliteAutorisees = new Set(["PUBLIC", "FOLLOWERS", "FRIENDS", "PRIVATE"]);
  const visibiliteSure = visibiliteAutorisees.has(visibilite) ? visibilite : "PUBLIC";

  if (!contenu) return reponse.redirect("/posts/feed");

  await query(
    "INSERT INTO Post (content, visibility, authorId, createdAt) VALUES (?, ?, ?, NOW())",
    [contenu, visibiliteSure, requete.user.id]
  );

  reponse.redirect("/posts/feed");
});

//////////
// Ajoute un like à une publication
// Crée une notification pour l'auteur
// Retourne: redirect vers feed ou groupe si applicable
//////////
routesPosts.post("/:id/like", exigerAuthentification, async (requete, reponse) => {
  const idPublication = Number(requete.params.id);
  if (!Number.isFinite(idPublication)) return reponse.redirect("/posts/feed");

  const publication = await queryOne(
    "SELECT id, authorId, groupId FROM Post WHERE id = ?",
    [idPublication]
  );
  if (!publication) return reponse.redirect("/posts/feed");

  try {
    await query(
      "INSERT INTO `Like` (userId, postId) VALUES (?, ?)",
      [requete.user.id, idPublication]
    );

    await creerNotification({
      type: "LIKE",
      toUserId: publication.authorId,
      fromUserId: requete.user.id,
      postId: idPublication
    });

  } catch {
    await query(
      "DELETE FROM `Like` WHERE userId = ? AND postId = ?",
      [requete.user.id, idPublication]
    ).catch(() => {});
  }

  if (publication.groupId) {
    reponse.redirect(`/groups/${publication.groupId}`);
  } else {
    reponse.redirect("/posts/feed");
  }
});





