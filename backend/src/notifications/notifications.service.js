import { query, queryOne } from "../db.js";
import { envoyerAUtilisateur } from "../realtime/sse.js";

//////////
// Crée une notification et l'envoie via SSE
// Récupère le compteur unread et le pousse à l'utilisateur
// N'envoie pas de notification si l'utilisateur a muté l'auteur
// Retourne: objet notification complet
//////////
export async function creerNotification({
  type,
  toUserId,
  fromUserId = null,
  postId = null,
  commentId = null,
  friendRequestId = null,
  eventId = null
}) {
  if (fromUserId && toUserId === fromUserId) return;

  // Vérifier si toUserId a muté fromUserId
  if (fromUserId) {
    const estMute = await queryOne(
      "SELECT * FROM UserMute WHERE muterId = ? AND mutedId = ?",
      [toUserId, fromUserId]
    );
    if (estMute) return;
  }

  const resultat = await query(
    "INSERT INTO Notification (type, toUserId, fromUserId, postId, commentId, friendRequestId, eventId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
    [type, toUserId, fromUserId, postId, commentId, friendRequestId, eventId]
  );

  const idNotif = resultat.insertId;

  const notif = await queryOne(`
    SELECT
      n.*,
      u.id as fromUser_id,
      u.displayName as fromUser_displayName,
      e.id as event_id,
      e.title as event_title,
      e.groupId as event_groupId
    FROM Notification n
    LEFT JOIN User u ON n.fromUserId = u.id
    LEFT JOIN Event e ON n.eventId = e.id
    WHERE n.id = ?
  `, [idNotif]);

  const resultatCompteur = await queryOne(
    "SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL",
    [toUserId]
  );
  const compteurNotifications = resultatCompteur ? resultatCompteur.count : 0;

  envoyerAUtilisateur(toUserId, {
    id: notif.id,
    type: notif.type,
    createdAt: notif.createdAt,
    fromUser: notif.fromUser_id ? {
      id: notif.fromUser_id,
      displayName: notif.fromUser_displayName
    } : null,
    event: notif.event_id ? {
      id: notif.event_id,
      title: notif.event_title,
      groupId: notif.event_groupId
    } : null,
    unreadCount: compteurNotifications
  });

  return notif;
}

//////////
// Marque toutes les notifications comme lues
// Met à jour la colonne readAt pour l'utilisateur
// Retourne: void
//////////
export async function marquerToutCommeLu(idUtilisateur) {
  return query(
    "UPDATE Notification SET readAt = NOW() WHERE toUserId = ? AND readAt IS NULL",
    [idUtilisateur]
  );
}

//////////
// Obtient le compteur de notifications non lues
// Compte les notifications avec readAt = NULL
// Filtre les notifications des utilisateurs mutés
// Retourne: nombre entier (count)
//////////
export async function obtenirCompteurNotifications(idUtilisateur) {
  // Récupérer les utilisateurs mutés
  const utilisateursMutesData = await query(
    "SELECT mutedId FROM UserMute WHERE muterId = ?",
    [idUtilisateur]
  );
  const idsMutes = utilisateursMutesData.map(m => m.mutedId);

  let clauseExclusion = "";
  let parametres = [idUtilisateur];
  
  if (idsMutes.length > 0) {
    clauseExclusion = ` AND fromUserId NOT IN (${idsMutes.map(() => '?').join(',')})`;
    parametres.push(...idsMutes);
  }

  const resultat = await queryOne(
    `SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL${clauseExclusion}`,
    parametres
  );
  return resultat ? resultat.count : 0;
}







