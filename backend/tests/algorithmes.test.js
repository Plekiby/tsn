/**
 * Tests unitaires pour les algorithmes du système de recommandation
 * - Scoring du feed
 * - Algorithme FOAF (Friends of Friends)
 * - Similarité Jaccard pour les intérêts
 */

// ===== ALGORITHME DE SCORING DU FEED =====

/**
 * Calcule le score de relation entre deux utilisateurs
 * Basé sur le type de relation (ami, suivi, inconnu)
 */
function calculerScoreRelation(estMutuel, estSuivi) {
  if (estMutuel) return 100; // Ami mutuel
  if (estSuivi) return 50;    // Suivi (follow)
  return 10;                  // Inconnu (PUBLIC)
}

/**
 * Test du score de relation
 */
function testScoreRelation() {
  console.log("=== TEST: Score de Relation ===");
  
  const tests = [
    { estMutuel: true, estSuivi: true, attendu: 100, label: "Ami mutuel" },
    { estMutuel: false, estSuivi: true, attendu: 50, label: "Suivi" },
    { estMutuel: false, estSuivi: false, attendu: 10, label: "Post public" }
  ];

  tests.forEach(test => {
    const resultat = calculerScoreRelation(test.estMutuel, test.estSuivi);
    const pass = resultat === test.attendu ? "OUI" : "NON";
    console.log(`${pass} ${test.label}: ${resultat} pts (attendu: ${test.attendu})`);
  });
}

// ===== ALGORITHME DE SCORE D'INTÉRÊTS (JACCARD) =====

/**
 * Calcule la similarité Jaccard entre deux ensembles
 * Jaccard = (intersection) / (union)
 * Chaque intérêt commun = 6 points
 */
function calculerScoreInterets(interetsCommuns, interetsUnion) {
  if (interetsUnion === 0) return 0;
  const similariteJaccard = interetsCommuns / interetsUnion;
  return interetsCommuns * 6; // 6 pts par intérêt commun
}

/**
 * Test du score d'intérêts avec Jaccard
 */
function testScoreInterets() {
  console.log("\n=== TEST: Score d'Intérêts (Jaccard) ===");
  
  const tests = [
    { 
      communs: 3, 
      union: 5, 
      attendu: 18, 
      label: "3 intérêts communs / 5 total (Jaccard: 60%)",
      jaccard: (3/5)
    },
    { 
      communs: 0, 
      union: 5, 
      attendu: 0, 
      label: "Aucun intérêt commun (Jaccard: 0%)",
      jaccard: 0
    },
    { 
      communs: 5, 
      union: 5, 
      attendu: 30, 
      label: "Tous les intérêts en commun (Jaccard: 100%)",
      jaccard: 1
    }
  ];

  tests.forEach(test => {
    const resultat = calculerScoreInterets(test.communs, test.union);
    const jaccard = test.jaccard;
    const pass = resultat === test.attendu ? "OUI" : "NON";
    console.log(`${pass} ${test.label}`);
    console.log(`   Score: ${resultat} pts | Jaccard: ${(jaccard * 100).toFixed(1)}%`);
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
 * Trouve les amis potentiels à 2 hops de distance
 */
function foafRecommandations(idUtilisateur, mesamis, amisDeMesAmis) {
  // Récupérer les amis de mes amis
  const candidats = new Set();
  
  amisDeMesAmis.forEach(ami => {
    if (!mesamis.has(ami.id) && ami.id !== idUtilisateur) {
      candidats.add(ami.id);
    }
  });

  return Array.from(candidats);
}

/**
 * Test du FOAF
 */
function testFOAF() {
  console.log("\n=== TEST: Algorithme FOAF ===");
  
  const idUtilisateur = 1;
  const mesAmis = new Set([2, 3]); // Je suis ami avec 2 et 3
  const amisDeMesAmis = [
    { id: 4 }, // 2 est ami avec 4
    { id: 5 }, // 2 est ami avec 5
    { id: 6 }, // 3 est ami avec 6
    { id: 2 }  // 3 est ami avec 2 (déjà mon ami)
  ];

  const recommandations = foafRecommandations(idUtilisateur, mesAmis, amisDeMesAmis);
  
  console.log(`Pour l'utilisateur ${idUtilisateur}:`);
  console.log(`   Mes amis: [${Array.from(mesAmis).join(", ")}]`);
  console.log(`   Recommandations FOAF: [${recommandations.join(", ")}]`);
  console.log(`   (Amis de mes amis que je ne connais pas encore)`);
}

// ===== EXECUTION DE TOUS LES TESTS =====

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║   TESTS UNITAIRES - ALGORITHMES DE RECOMMANDATION TSN      ║");
console.log("╚════════════════════════════════════════════════════════════╝");

testScoreRelation();
testScoreInterets();
testScoreFraicheur();
testScoreEngagement();
testScoreTotal();
testFOAF();
