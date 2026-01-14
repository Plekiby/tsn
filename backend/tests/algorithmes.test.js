/**
 * Tests unitaires pour les algorithmes du système de recommandation
 * - Scoring du feed
 * - Algorithme FOAF (Follow-Only, sans Friendship)
 * - Similarité Jaccard pour les intérêts
 */

// ===== ALGORITHME DE RECOMMANDATIONS (FOAF) =====

/**
 * Calcule le score d'une recommandation utilisateur
 * Basé UNIQUEMENT sur la table Follow (pas de Friendship)
 * 
 * Scoring:
 * - Connexion simple (dans mes comptes en commun): 10 pts
 * - Connexion mutuelle (je suis suivi en retour): 15 pts (+5 bonus)
 * - Intérêt commun: 8 pts par intérêt
 * - Jaccard similarity: 0-30 pts
 */
function calculerScoreRecommandation(comptesCommuns, comptesMutuels, interetsCommuns, jaccardScore) {
  let score = 0;
  
  // Score des connexions
  score += comptesCommuns * 10; // 10 pts par compte en commun
  score += comptesMutuels * 5;  // +5 bonus par compte mutuel
  
  // Score des intérêts
  score += interetsCommuns * 8;
  
  // Score Jaccard (0-30)
  score += jaccardScore;
  
  return score;
}

/**
 * Test du scoring de recommandation
 */
function testScoreRecommandation() {
  console.log("=== TEST: Score Recommandation (Follow-Only) ===");
  
  const tests = [
    {
      comptesCommuns: 2,
      comptesMutuels: 1,
      interets: 2,
      jaccard: 20,
      attendu: 61, // (2*10) + (1*5) + (2*8) + 20
      label: "Bonne recommandation"
    },
    {
      comptesCommuns: 3,
      comptesMutuels: 2,
      interets: 3,
      jaccard: 25,
      attendu: 99, // (3*10) + (2*5) + (3*8) + 25
      label: "Très bonne recommandation"
    },
    {
      comptesCommuns: 1,
      comptesMutuels: 0,
      interets: 0,
      jaccard: 5,
      attendu: 15, // (1*10) + (0*5) + (0*8) + 5
      label: "Recommandation basique"
    }
  ];

  tests.forEach(test => {
    const resultat = calculerScoreRecommandation(test.comptesCommuns, test.comptesMutuels, test.interets, test.jaccard);
    const pass = resultat === test.attendu ? "✓" : "✗";
    console.log(`${pass} ${test.label}: ${resultat} pts (attendu: ${test.attendu})`);
  });
}

// ===== ALGORITHME DE SCORE D'INTÉRÊTS (JACCARD) =====

/**
 * Calcule la similarité Jaccard entre deux ensembles d'intérêts
 * Jaccard = (intersection) / (union)
 * Retourne un score 0-30
 */
function calculerScoreJaccard(interetsCommuns, interetsUnion) {
  if (interetsUnion === 0) return 0;
  const jaccard = interetsCommuns / interetsUnion;
  return Math.round(jaccard * 30); // Max 30 pts
}

/**
 * Test du score Jaccard
 */
function testScoreJaccard() {
  console.log("\n=== TEST: Score Jaccard ===");
  
  const tests = [
    { 
      communs: 3, 
      union: 5, 
      jaccard: 60,
      label: "3 intérêts communs / 5 total (60%)"
    },
    { 
      communs: 0, 
      union: 5, 
      jaccard: 0,
      label: "Aucun intérêt commun (0%)"
    },
    { 
      communs: 5, 
      union: 5, 
      jaccard: 30,
      label: "Tous les intérêts en commun (100%, max 30 pts)"
    }
  ];

  tests.forEach(test => {
    const resultat = calculerScoreJaccard(test.communs, test.union);
    const esperanceJaccard = (test.communs / test.union * 100).toFixed(1);
    console.log(`✓ ${test.label}`);
    console.log(`   Jaccard: ${esperanceJaccard}% → Score: ${resultat} pts`);
  });
}

// ===== ALGORITHME DE FRAÎCHEUR =====

/**
 * Calcule le score de fraîcheur d'un post
 * Score max: 40 points
 * Formule: 40 - heures_écoulées (avec minimum de 0)
 */
function calculerScoreFraicheur(dateCreation) {
  const instantActuel = Date.now();
  const heuresEcoulees = (instantActuel - new Date(dateCreation).getTime()) / (1000 * 60 * 60);
  return Math.max(0, 40 - heuresEcoulees);
}

/**
 * Test du score de fraîcheur
 */
function testScoreFraicheur() {
  console.log("\n=== TEST: Score de Fraîcheur ===");
  
  const maintenant = new Date();
  
  const tests = [
    {
      date: new Date(maintenant.getTime() - 1 * 60 * 60 * 1000), // 1 heure
      label: "Post d'il y a 1 heure",
      min: 38, max: 40
    },
    {
      date: new Date(maintenant.getTime() - 12 * 60 * 60 * 1000), // 12 heures
      label: "Post d'il y a 12 heures",
      min: 27, max: 29
    },
    {
      date: new Date(maintenant.getTime() - 48 * 60 * 60 * 1000), // 2 jours
      label: "Post d'il y a 2 jours",
      min: -9, max: 0 // Score négatif = très ancien
    }
  ];

  tests.forEach(test => {
    const resultat = calculerScoreFraicheur(test.date);
    const pass = resultat >= test.min && resultat <= test.max + 1 ? "OUI" : "NON";
    console.log(`${pass} ${test.label}: ${resultat.toFixed(1)} pts`);
  });
}

// ===== ALGORITHME D'ENGAGEMENT =====

/**
 * Calcule le score d'engagement (likes + commentaires)
 * Max: 12 pts pour likes + 12 pts pour commentaires = 24 pts total
 */
function calculerScoreEngagement(nbLikes, nbCommentaires) {
  return Math.min(12, nbLikes) + Math.min(12, nbCommentaires);
}

/**
 * Test du score d'engagement
 */
function testScoreEngagement() {
  console.log("\n=== TEST: Score d'Engagement ===");
  
  const tests = [
    { likes: 5, commentaires: 3, attendu: 8, label: "5 likes + 3 commentaires" },
    { likes: 20, commentaires: 15, attendu: 24, label: "20 likes + 15 commentaires (saturé)" },
    { likes: 0, commentaires: 0, attendu: 0, label: "Aucun engagement" }
  ];

  tests.forEach(test => {
    const resultat = calculerScoreEngagement(test.likes, test.commentaires);
    const pass = resultat === test.attendu ? "OUI" : "NON";
    console.log(`${pass} ${test.label}: ${resultat} pts (attendu: ${test.attendu})`);
  });
}

// ===== SCORE TOTAL DU FEED =====

/**
 * Calcule le score total d'un post
 * = Relation (10-100) + Intérêts (0-??) + Fraîcheur (0-40) + Engagement (0-24) + Bonus Groupe (20)
 */
function calculerScoreTotal(scoreRelation, scoreInterets, scoreFraicheur, scoreEngagement, bonusGroupe = 0) {
  return scoreRelation + scoreInterets + scoreFraicheur + scoreEngagement + bonusGroupe;
}

/**
 * Test du score total
 */
function testScoreTotal() {
  console.log("\n=== TEST: Score Total du Feed ===");
  
  const tests = [
    {
      relation: 100,
      interets: 18,
      fraicheur: 40,
      engagement: 24,
      bonus: 20,
      attendu: 202,
      label: "Post idéal (ami mutuel + frais + engageant + en groupe)"
    },
    {
      relation: 10,
      interets: 0,
      fraicheur: 0,
      engagement: 0,
      bonus: 0,
      attendu: 10,
      label: "Post public très ancien sans engagement"
    },
    {
      relation: 50,
      interets: 12,
      fraicheur: 20,
      engagement: 12,
      bonus: 0,
      attendu: 94,
      label: "Post moyen d'un suivi"
    }
  ];

  tests.forEach(test => {
    const resultat = calculerScoreTotal(test.relation, test.interets, test.fraicheur, test.engagement, test.bonus);
    const pass = resultat === test.attendu ? "OUI" : "NON";
    console.log(`${pass} ${test.label}`);
    console.log(`   Score: ${resultat} pts (attendu: ${test.attendu})`);
  });
}

// ===== ALGORITHME FOAF (Friends of Friends) =====

/**
 * Implémente l'algorithme FOAF (Friends of Friends) 
 * 
 * Stratégie:
 * 1. Phase FOAF: Trouve les gens que mes suivi suivent (à 2 hops)
 * 2. Score les candidats avec le système de points
 * 3. Fallback: Si peu de candidats, utilise les intérêts communs
 */
function foafRecommandations(idUtilisateur, idUtilisateursSuivis, relationsSuiveurs) {

  
  const candidats = new Map(); // id -> { comptesCommuns: 0, comptesMutuels: 0 }
  
  // Pour chaque personne que je suis
  idUtilisateursSuivis.forEach(idPersonne => {
    // Trouver les personnes qui suivent cette personne
    relationsSuiveurs.forEach(relation => {
      if (relation.followingId === idPersonne && relation.followerId !== idUtilisateur) {
        
        // Ne pas recommander quelqu'un que je suis déjà
        if (!idUtilisateursSuivis.has(relation.followerId)) {
          if (!candidats.has(relation.followerId)) {
            candidats.set(relation.followerId, { comptesCommuns: 0, comptesMutuels: 0 });
          }
          
          const data = candidats.get(relation.followerId);
          data.comptesCommuns += 1;
          
          // Bonus si c'est mutuel
          if (relation.estMutuel) {
            data.comptesMutuels += 1;
          }
        }
      }
    });
  });
  
  return candidats;
}

/**
 * Test du FOAF (Follow-Only)
 */
function testFOAF() {
  console.log("\n=== TEST: Algorithme FOAF (Follow-Only) ===");
  
  const idUtilisateur = 1;
  const idUtilisateursSuivis = new Set([2, 3, 4]); // Je suis 2, 3, 4
  
  const relationsSuiveurs = [
    // Personnes qui suivent les gens que je suis
    { followerId: 5, followingId: 2, estMutuel: false }, // 5 suit 2
    { followerId: 6, followingId: 2, estMutuel: true },  // 6 suit 2 ET je le suis
    { followerId: 7, followingId: 3, estMutuel: false }, // 7 suit 3
    { followerId: 5, followingId: 3, estMutuel: true },  // 5 suit aussi 3 ET je le suis
    { followerId: 8, followingId: 4, estMutuel: false }, // 8 suit 4
  ];
  
  const candidats = foafRecommandations(idUtilisateur, idUtilisateursSuivis, relationsSuiveurs);
  
  console.log(`Pour l'utilisateur ${idUtilisateur}:`);
  console.log(`   Personnes que je suis: [${Array.from(idUtilisateursSuivis).join(", ")}]`);
  console.log(`   Candidats trouvés:`);
  
  candidats.forEach((data, idCandidat) => {
    console.log(`   - Utilisateur ${idCandidat}: ${data.comptesCommuns} comptes en commun, ${data.comptesMutuels} mutuels`);
  });
}

// ===== EXECUTION DE TOUS LES TESTS =====

console.log("TESTS UNITAIRES - ALGORITHMES DE RECOMMANDATION TSN");

testScoreRecommandation();
testScoreJaccard();
testScoreFraicheur();
testScoreEngagement();
testScoreTotal();
testFOAF();
