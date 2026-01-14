import express from "express";
import { query, queryOne } from "../db.js";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { creerNotification } from "../notifications/notifications.service.js";

export const routesUtilisateurs = express.Router();

//////////
// Récupère les recommandations basées sur:
// - FOAF (Friends Of A Friend): gens suivis par ceux que je suis
// - Intérêts communs: pour les nouveaux utilisateurs
// Scoring:
// - Comptes de 1-hop (Follow) = 10 pts par personne en commun
// - Intérêts communs = 8 pts par intérêt
// - Bonus Jaccard = 30 pts max
//////////
routesUtilisateurs.get("/recommendations", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateur = requete.user.id;

  // 1) Récupérer ceux que JE suis (1-hop)
  const mesAbonnementsData = await query(
    "SELECT followedId FROM Follow WHERE followerId = ?",
    [idUtilisateur]
  );

  const deja = new Set(mesAbonnementsData.map(x => x.followedId));
  deja.add(idUtilisateur);
  const ceuxQuejeSuis = mesAbonnementsData.map(x => x.followedId);

  // 2) 2-hop: ceux qui sont suivis par ceux que je suis
  const sautDeux = ceuxQuejeSuis.length > 0
    ? await query(
        `SELECT followerId, followedId FROM Follow WHERE followerId IN (${ceuxQuejeSuis.map(() => '?').join(',')})`,
        ceuxQuejeSuis
      )
    : [];

  // 3) Compter les "comptes en commun" = nombre de gens que je suis qui suivent le candidat
  // + détecter si ces comptes en commun sont MUTUELS avec le candidat
  const comptageComptesEnCommun = new Map();
  const comptageComptesEnCommunMutuels = new Map();
  const personnesEnCommun = new Map(); // Pour chaque candidat, liste des gens que je suis qui le suivent
  const personnesMutuelles = new Map(); // Pour chaque candidat, liste des MUTUELS seulement
  
  for (const row of sautDeux) {
    const candidat = row.followedId;
    const suiveur = row.followerId; // La personne qui suit le candidat
    if (deja.has(candidat)) continue;
    comptageComptesEnCommun.set(candidat, (comptageComptesEnCommun.get(candidat) || 0) + 1);
    
    if (!personnesEnCommun.has(candidat)) {
      personnesEnCommun.set(candidat, []);
    }
    personnesEnCommun.get(candidat).push(suiveur);
  }

  // Vérifier lesquels sont MUTUELS (bidirectionnels)
  for (const [candidat, personnes] of personnesEnCommun) {
    personnesMutuelles.set(candidat, []);
    for (const personne of personnes) {
      const existeMutuel = await queryOne(
        "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
        [candidat, personne]
      );
      if (existeMutuel) {
        comptageComptesEnCommunMutuels.set(candidat, (comptageComptesEnCommunMutuels.get(candidat) || 0) + 1);
        personnesMutuelles.get(candidat).push(personne); // Ajouter à la liste des mutuels
      }
    }
  }

  const candidats = [...comptageComptesEnCommun.keys()];
  
  // Si pas de candidats FOAF, chercher par intérêts communs
  let recommendationsFinales = [];
  
  if (candidats.length === 0) {
    const mesInterets = await query(
      "SELECT ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId = ?",
      [idUtilisateur]
    );
    
    if (mesInterets.length === 0) {
      return reponse.render("users/recommendations", { user: requete.user, reco: [] });
    }
    
    const idsIntereits = mesInterets.map(x => x.interestId);
    
    // Trouver ceux qui partagent au moins 1 intérêt
    const utilisateursSimilaires = await query(
      `SELECT ui.userId, COUNT(*) as nbInteretsCommuns
       FROM UserInterest ui
       WHERE ui.interestId IN (${idsIntereits.map(() => '?').join(',')})
         AND ui.userId NOT IN (?)
       GROUP BY ui.userId
       ORDER BY nbInteretsCommuns DESC
       LIMIT 20`,
      [...idsIntereits, idUtilisateur]
    );
    
    if (utilisateursSimilaires.length === 0) {
      return reponse.render("users/recommendations", { user: requete.user, reco: [] });
    }

    const idsUtilisateurs = utilisateursSimilaires.map(u => u.userId);
    
    // Infos + intérêts
    const infos = await query(
      `SELECT id, displayName, email, bio FROM User WHERE id IN (${idsUtilisateurs.map(() => '?').join(',')})`,
      idsUtilisateurs
    );
    
    const interets = await query(
      `SELECT ui.userId, ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId IN (${idsUtilisateurs.map(() => '?').join(',')})`,
      idsUtilisateurs
    );
    
    const ensembleIntereitsParUtilisateur = new Map();
    const interetsCommuns = new Map();
    
    for (const row of interets) {
      if (!ensembleIntereitsParUtilisateur.has(row.userId)) {
        ensembleIntereitsParUtilisateur.set(row.userId, new Set());
      }
      ensembleIntereitsParUtilisateur.get(row.userId).add(row.interestId);
      
      if (idsIntereits.includes(row.interestId)) {
        if (!interetsCommuns.has(row.userId)) interetsCommuns.set(row.userId, []);
        interetsCommuns.get(row.userId).push(row.name);
      }
    }
    
    const idsIntereitsSet = new Set(idsIntereits);
    function jaccard(ensA, ensB) {
      if (ensA.size === 0 && ensB.size === 0) return 0;
      let intersection = 0;
      for (const x of ensA) if (ensB.has(x)) intersection++;
      const union = ensA.size + ensB.size - intersection;
      return union === 0 ? 0 : intersection / union;
    }
    
    const infoMap = new Map(infos.map(u => [u.id, u]));
    
    recommendationsFinales = idsUtilisateurs
      .map(id => {
        const communs = interetsCommuns.get(id) || [];
        const ensInteret = ensembleIntereitsParUtilisateur.get(id) || new Set();
        const scoreJaccard = jaccard(idsIntereitsSet, ensInteret);
        const score = communs.length * 8 + scoreJaccard * 30;
        
        return {
          id,
          displayName: infoMap.get(id)?.displayName || `User#${id}`,
          email: infoMap.get(id)?.email || "",
          bio: infoMap.get(id)?.bio || null,
          score: Number(score.toFixed(1)),
          nbConnexions: 0,
          nbConnexionsMutuelles: 0,
          nomsAmisCommunsAffichage: [],
          scoreJaccard: Number(scoreJaccard.toFixed(3)),
          interetsCommuns: communs,
          nbInteretsCommuns: communs.length,
          pourcentageInterets: idsIntereits.length > 0
            ? Math.round((communs.length / idsIntereits.length) * 100)
            : 0
        };
      })
      .sort((a, b) => b.score - a.score);
    
    return reponse.render("users/recommendations", { user: requete.user, reco: recommendationsFinales });
  }

  // 4) Récupérer mes intérêts
  const mesInterets = await query(
    "SELECT ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId = ?",
    [idUtilisateur]
  );
  const idsIntereitsSet = new Set(mesInterets.map(x => x.interestId));

  // 5) Intérêts des candidats
  const interetsData = candidats.length > 0
    ? await query(
        `SELECT ui.userId, ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId IN (${candidats.map(() => '?').join(',')})`,
        candidats
      )
    : [];

  const ensembleIntereits = new Map();
  const nomsInteretsCommuns = new Map();

  for (const row of interetsData) {
    if (!ensembleIntereits.has(row.userId)) ensembleIntereits.set(row.userId, new Set());
    ensembleIntereits.get(row.userId).add(row.interestId);

    if (idsIntereitsSet.has(row.interestId)) {
      if (!nomsInteretsCommuns.has(row.userId)) nomsInteretsCommuns.set(row.userId, []);
      nomsInteretsCommuns.get(row.userId).push(row.name);
    }
  }

  // 6) Récupérer les noms des gens en commun
  const tousLesGensEnCommun = new Set();
  for (const personnes of personnesEnCommun.values()) {
    for (const personne of personnes) {
      tousLesGensEnCommun.add(personne);
    }
  }
  
  const infosGensEnCommun = tousLesGensEnCommun.size > 0
    ? await query(
        `SELECT id, displayName FROM User WHERE id IN (${[...tousLesGensEnCommun].map(() => '?').join(',')})`,
        [...tousLesGensEnCommun]
      )
    : [];
  const nomParId = new Map(infosGensEnCommun.map(u => [u.id, u.displayName]));

  // 7) Infos des candidats
  const utilisateurs = candidats.length > 0
    ? await query(
        `SELECT id, displayName, email, bio FROM User WHERE id IN (${candidats.map(() => '?').join(',')})`,
        candidats
      )
    : [];
  const utilisateurMap = new Map(utilisateurs.map(u => [u.id, u]));

  // 8) Jaccard similarity
  function jaccard(ensA, ensB) {
    if (ensA.size === 0 && ensB.size === 0) return 0;
    let intersection = 0;
    for (const x of ensA) if (ensB.has(x)) intersection++;
    const union = ensA.size + ensB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  recommendationsFinales = candidats
    .map((id) => {
      const nbComptesEnCommun = comptageComptesEnCommun.get(id) || 0;
      const nbComptesEnCommunMutuels = comptageComptesEnCommunMutuels.get(id) || 0;
      const nbComptesSimples = nbComptesEnCommun - nbComptesEnCommunMutuels;
      const communs = nomsInteretsCommuns.get(id) || [];
      const nbCommunsInterets = communs.length;
      const ensInteret = ensembleIntereits.get(id) || new Set();
      const scoreJaccard = jaccard(idsIntereitsSet, ensInteret);

      // Récupérer les noms des gens en commun
      const gensEnCommunPourCeCandidat = personnesEnCommun.get(id) || [];
      const mutuelsForId = personnesMutuelles.get(id) || [];
      const nomsAmisCommunsAffichage = gensEnCommunPourCeCandidat.map(idPersonne => {
        const nom = nomParId.get(idPersonne) || `#${idPersonne}`;
        // Vérifier si cette personne SPÉCIFIQUE est mutuelle
        const isMutuel = mutuelsForId.includes(idPersonne);
        return isMutuel ? `${nom} ✓` : nom;
      });

      // SCORING:
      // - 10 pts par compte en commun simple
      // - 15 pts par compte en commun MUTUEL (bonus de 5 pts)
      // - 8 pts par intérêt commun
      // - 30 pts max de bonus Jaccard
      const scoreComptesSimples = nbComptesSimples * 10;
      const scoreComptesMutuels = nbComptesEnCommunMutuels * 15;
      const scoreComptes = scoreComptesSimples + scoreComptesMutuels;
      const scoreInterets = nbCommunsInterets * 8;
      const bonusJaccard = scoreJaccard * 30;
      const scoreTotal = scoreComptes + scoreInterets + bonusJaccard;

      return {
        id,
        displayName: utilisateurMap.get(id)?.displayName || `User#${id}`,
        email: utilisateurMap.get(id)?.email || "",
        bio: utilisateurMap.get(id)?.bio || null,
        score: Number(scoreTotal.toFixed(1)),
        nbConnexions: nbComptesEnCommun,
        nbConnexionsMutuelles: nbComptesEnCommunMutuels,
        nomsAmisCommunsAffichage,
        scoreJaccard: Number(scoreJaccard.toFixed(3)),
        interetsCommuns: communs,
        nbInteretsCommuns: nbCommunsInterets,
        pourcentageInterets: idsIntereitsSet.size > 0
          ? Math.round((nbCommunsInterets / idsIntereitsSet.size) * 100)
          : 0
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  reponse.render("users/recommendations", { user: requete.user, reco: recommendationsFinales });
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



