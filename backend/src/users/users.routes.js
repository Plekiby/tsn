import express from "express";
import { query, queryOne } from "../db.js";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { creerNotification } from "../notifications/notifications.service.js";

export const routesUtilisateurs = express.Router();

//////////
// Récupère les recommandations FOAF (amis d'amis)
// Utilise un système de scoring basé sur:
// - Connexions simples (10 pts), mutuelles (20 pts)
// - Intérêts communs (3 pts par intérêt)
// - Jaccard similarity (jusqu'à 20 pts bonus)
// Retourne: liste triée de 20 candidats recommandés
//////////
routesUtilisateurs.get("/recommendations", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateur = requete.user.id;

  // 1) Récupérer mes abonnements (1-hop)
  const mesAbonnementsData = await query(
    "SELECT followedId FROM Follow WHERE followerId = ?",
    [idUtilisateur]
  );

  const deja = new Set(mesAbonnementsData.map(x => x.followedId));
  deja.add(idUtilisateur);
  const sautUn = mesAbonnementsData.map(x => x.followedId);

  // 2) 2-hop: abonnements des gens que je suis
  const sautDeux = sautUn.length > 0
    ? await query(
        `SELECT followerId, followedId FROM Follow WHERE followerId IN (${sautUn.map(() => '?').join(',')})`,
        sautUn
      )
    : [];

  // 3) Construire les statistiques et détecter les connexions bidirectionnelles
  const comptageConnexions = new Map();
  const quiEstConnecte = new Map();
  const comptageAmisCommuns = new Map();

  for (const areteRelation of sautDeux) {
    const personneMutuele = areteRelation.followerId;
    const candidat = areteRelation.followedId;

    if (deja.has(candidat)) continue;

    comptageConnexions.set(candidat, (comptageConnexions.get(candidat) || 0) + 1);

    if (!quiEstConnecte.has(candidat)) quiEstConnecte.set(candidat, new Set());

    const estMutuel = await queryOne(
      "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
      [personneMutuele, candidat]
    ).then(resultat => {
      if (resultat) {
        return queryOne(
          "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
          [candidat, personneMutuele]
        );
      }
      return null;
    });

    quiEstConnecte.get(candidat).add({ id: personneMutuele, estMutuel: !!estMutuel });

    if (estMutuel) {
      comptageAmisCommuns.set(candidat, (comptageAmisCommuns.get(candidat) || 0) + 1);
    }
  }

  const candidats = [...comptageConnexions.keys()];
  if (candidats.length === 0) {
    return reponse.render("users/recommendations", { user: requete.user, reco: [] });
  }

  // 4) Récupérer mes intérêts
  const mesInteretsData = await query(
    "SELECT ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId = ?",
    [idUtilisateur]
  );
  const idsIntereits = new Set(mesInteretsData.map(x => x.interestId));

  // 5) Intérêts des candidats (par batch)
  const interetsCandidat = candidats.length > 0
    ? await query(
        `SELECT ui.userId, ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId IN (${candidats.map(() => '?').join(',')})`,
        candidats
      )
    : [];

  const ensembleInteretsCandidats = new Map();
  const nomsInteretsCommuns = new Map();

  for (const ligne of interetsCandidat) {
    if (!ensembleInteretsCandidats.has(ligne.userId)) ensembleInteretsCandidats.set(ligne.userId, new Set());
    ensembleInteretsCandidats.get(ligne.userId).add(ligne.interestId);

    if (idsIntereits.has(ligne.interestId)) {
      if (!nomsInteretsCommuns.has(ligne.userId)) nomsInteretsCommuns.set(ligne.userId, []);
      nomsInteretsCommuns.get(ligne.userId).push(ligne.name);
    }
  }

  // 6) Récupérer les infos utilisateurs
  const utilisateurs = candidats.length > 0
    ? await query(
        `SELECT id, displayName, email, bio FROM User WHERE id IN (${candidats.map(() => '?').join(',')})`,
        candidats
      )
    : [];
  const utilisateurParId = new Map(utilisateurs.map(u => [u.id, u]));

  const idsAmisCommunsTotal = new Set();
  for (const ensemble of quiEstConnecte.values()) {
    for (const obj of ensemble) idsAmisCommunsTotal.add(obj.id);
  }

  const utilisateursAmisCommuns = idsAmisCommunsTotal.size > 0
    ? await query(
        `SELECT id, displayName FROM User WHERE id IN (${[...idsAmisCommunsTotal].map(() => '?').join(',')})`,
        [...idsAmisCommunsTotal]
      )
    : [];
  const nomAmiCommunParId = new Map(utilisateursAmisCommuns.map(u => [u.id, u.displayName]));

  // 7) Calculer le score avec similarité Jaccard
  function similariteJaccard(ensembleA, ensembleB) {
    if (ensembleA.size === 0 && ensembleB.size === 0) return 0;
    let intersection = 0;
    for (const x of ensembleA) if (ensembleB.has(x)) intersection++;
    const union = ensembleA.size + ensembleB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  const recommendations = candidats
    .map((idCandidat) => {
      const candidatData = utilisateurParId.get(idCandidat);
      const nbConnexions = comptageConnexions.get(idCandidat) || 0;
      const nbConnexionsMutuelles = comptageAmisCommuns.get(idCandidat) || 0;

      const ensembleInterets = ensembleInteretsCandidats.get(idCandidat) || new Set();
      const scoreJaccard = similariteJaccard(idsIntereits, ensembleInterets);

      const interetsCommuns = nomsInteretsCommuns.get(idCandidat) || [];
      const nbInteretsCommuns = interetsCommuns.length;

      const amisCommunsObjs = quiEstConnecte.has(idCandidat) ? [...quiEstConnecte.get(idCandidat)] : [];
      const nomsAmisCommunsAffichage = amisCommunsObjs.map(obj => {
        const nom = nomAmiCommunParId.get(obj.id) || `#${obj.id}`;
        return obj.estMutuel ? `${nom} (mutuel)` : nom;
      });

      const scoreConnexions = (nbConnexions - nbConnexionsMutuelles) * 10 + nbConnexionsMutuelles * 20;
      const scoreInterets = nbInteretsCommuns * 3;
      const bonusJaccard = scoreJaccard * 20;
      const scoreTotal = scoreConnexions + scoreInterets + bonusJaccard;

      return {
        id: idCandidat,
        displayName: candidatData?.displayName || `User#${idCandidat}`,
        email: candidatData?.email || "",
        bio: candidatData?.bio || null,
        score: Number(scoreTotal.toFixed(1)),
        nbConnexions,
        nbConnexionsMutuelles,
        nomsAmisCommunsAffichage,
        scoreJaccard: Number(scoreJaccard.toFixed(3)),
        interetsCommuns,
        nbInteretsCommuns,
        pourcentageInterets: idsIntereits.size > 0
          ? Math.round((nbInteretsCommuns / idsIntereits.size) * 100)
          : 0
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  reponse.render("users/recommendations", { user: requete.user, reco: recommendations });
});

//////////
// Activer/désactiver un follow
// Insère ou supprime une relation de follow
// Envoie une notification si création d'un follow
// Retourne: redirect vers la page précédente
//////////
routesUtilisateurs.post("/:id/follow", exigerAuthentification, async (requete, reponse) => {
  const idCible = Number(requete.params.id);
  const urlPrecedente = requete.get("referer") || "/users/recommendations";

  if (!Number.isFinite(idCible) || idCible === requete.user.id) {
    return reponse.redirect(urlPrecedente);
  }

  try {
    await query(
      "INSERT INTO Follow (followerId, followedId) VALUES (?, ?)",
      [requete.user.id, idCible]
    );

    await creerNotification({
      type: "FOLLOW",
      toUserId: idCible,
      fromUserId: requete.user.id
    });
  } catch {
    await query(
      "DELETE FROM Follow WHERE followerId = ? AND followedId = ?",
      [requete.user.id, idCible]
    ).catch(() => {});
  }

  reponse.redirect(urlPrecedente);
});

//////////
// Affiche la liste paginée de tous les utilisateurs
// Permet la recherche par nom, bio, email
// Enrichit avec les intérêts communs et statut de follow
// Retourne: page "users/all" avec pagination
//////////
routesUtilisateurs.get("/all", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateur = requete.user.id;
  const numeroPage = Math.max(1, parseInt(requete.query.page) || 1);
  const limiteParPage = 30;
  const decalage = (numeroPage - 1) * limiteParPage;
  const texteRecherche = requete.query.search?.trim() || "";

  // Construire la clause WHERE
  let clauseWhere = "WHERE u.id != ?";
  const parametres = [idUtilisateur];

  if (texteRecherche) {
    clauseWhere += " AND (u.displayName LIKE ? OR u.bio LIKE ? OR u.email LIKE ?)";
    const motifRecherche = `%${texteRecherche}%`;
    parametres.push(motifRecherche, motifRecherche, motifRecherche);
  }

  // Compter le total
  const [{ total }] = await query(
    `SELECT COUNT(*) as total FROM User u ${clauseWhere}`,
    parametres
  );

  const totalPages = Math.ceil(total / limiteParPage);

  // Récupérer les utilisateurs
  const utilisateurs = await query(
    `SELECT u.id, u.displayName, u.email, u.bio, u.avatar
     FROM User u
     ${clauseWhere}
     ORDER BY u.id DESC
     LIMIT ? OFFSET ?`,
    [...parametres, limiteParPage, decalage]
  );

  if (utilisateurs.length === 0) {
    return reponse.render("users/all", {
      user: requete.user,
      users: [],
      search: texteRecherche,
      page: numeroPage,
      totalPages,
      total: 0
    });
  }

  const idsUtilisateurs = utilisateurs.map(u => u.id);

  // Récupérer mes intérêts
  const mesInteretsData = await query(
    "SELECT interestId FROM UserInterest WHERE userId = ?",
    [idUtilisateur]
  );
  const idsIntereits = new Set(mesInteretsData.map(x => x.interestId));

  // Intérêts des utilisateurs (par batch)
  const donneeInteretUtilisateurs = idsUtilisateurs.length > 0
    ? await query(
        `SELECT ui.userId, ui.interestId, i.name
         FROM UserInterest ui
         JOIN Interest i ON ui.interestId = i.id
         WHERE ui.userId IN (${idsUtilisateurs.map(() => '?').join(',')})`,
        idsUtilisateurs
      )
    : [];

  const interetsUtilisateur = new Map();
  const interetsCommuns = new Map();

  for (const ligne of donneeInteretUtilisateurs) {
    if (!interetsUtilisateur.has(ligne.userId)) {
      interetsUtilisateur.set(ligne.userId, new Set());
    }
    interetsUtilisateur.get(ligne.userId).add(ligne.interestId);

    if (idsIntereits.has(ligne.interestId)) {
      if (!interetsCommuns.has(ligne.userId)) {
        interetsCommuns.set(ligne.userId, []);
      }
      interetsCommuns.get(ligne.userId).push(ligne.name);
    }
  }

  // Statut de follow
  const donneeStatutFollow = idsUtilisateurs.length > 0
    ? await query(
        `SELECT User.id as userId,
         (SELECT COUNT(*) FROM Follow WHERE followerId = ? AND followedId = User.id) as jeSuis,
         (SELECT COUNT(*) FROM Follow WHERE followerId = User.id AND followedId = ?) as suivMoi
         FROM User WHERE id IN (${idsUtilisateurs.map(() => '?').join(',')})`,
        [idUtilisateur, idUtilisateur, ...idsUtilisateurs]
      )
    : [];

  const statutFollow = new Map();
  for (const ligne of donneeStatutFollow) {
    statutFollow.set(ligne.userId, {
      jeSuis: ligne.jeSuis > 0,
      suivMoi: ligne.suivMoi > 0,
      estMutuel: ligne.jeSuis > 0 && ligne.suivMoi > 0
    });
  }

  // Enrichir les données
  const utilisateurEnrichi = utilisateurs.map(u => {
    const communs = interetsCommuns.get(u.id) || [];
    const statut = statutFollow.get(u.id) || { jeSuis: false, suivMoi: false, estMutuel: false };
    const totalInterets = interetsUtilisateur.get(u.id)?.size || 0;

    return {
      ...u,
      commonInterests: communs,
      commonCount: communs.length,
      totalInterets,
      interestPercentage: idsIntereits.size > 0
        ? Math.round((communs.length / idsIntereits.size) * 100)
        : 0,
      ...statut
    };
  });

  reponse.render("users/all", {
    user: requete.user,
    users: utilisateurEnrichi,
    search: texteRecherche,
    page: numeroPage,
    totalPages,
    total
  });
});



