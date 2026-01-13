const clients = new Map(); // userId -> Set(reponse)

//////////
// Ajoute un client SSE pour recevoir les mises à jour
// Enregistre la connexion reponse dans un Set pour l'utilisateur
// Retourne: void
//////////
export function ajouterClient(idUtilisateur, reponse) {
  if (!clients.has(idUtilisateur)) {
    clients.set(idUtilisateur, new Set());
  }
  clients.get(idUtilisateur).add(reponse);
}

//////////
// Retire un client SSE après déconnexion
// Supprime la connexion reponse du Set pour l'utilisateur
// Retourne: void
//////////
export function retirerClient(idUtilisateur, reponse) {
  const ensemble = clients.get(idUtilisateur);
  if (!ensemble) return;
  ensemble.delete(reponse);
  if (ensemble.size === 0) clients.delete(idUtilisateur);
}

//////////
// Envoie un payload à tous les clients SSE d'un utilisateur
// Écrit les données JSON dans chaque connexion
// Retourne: void
//////////
export function envoyerAUtilisateur(idUtilisateur, charge) {
  const ensemble = clients.get(idUtilisateur);
  if (!ensemble) return;

  const donnees = `data: ${JSON.stringify(charge)}\n\n`;
  for (const reponse of ensemble) {
    reponse.write(donnees);
  }
}

//////////
// Diffuse un message à un utilisateur (alias pour envoyerAUtilisateur)
// Retourne: void
//////////
export function diffuserMessage(idUtilisateur, charge) {
  envoyerAUtilisateur(idUtilisateur, charge);
}






