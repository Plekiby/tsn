import express from "express";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { query } from "../db.js";

export const routesNotifications = express.Router();

//////////
// Affiche toutes les notifications de l'utilisateur
// Charge aussi les invitations de groupe
// Filtre les notifications des utilisateurs mutés
// Retourne: vue notifications/index avec notifications et groupInvites
//////////
routesNotifications.get("/", exigerAuthentification, async (requete, reponse) => {
  // Récupérer les utilisateurs que j'ai mutés
  const utilisateursMutesData = await query(
    "SELECT mutedId FROM UserMute WHERE muterId = ?",
    [requete.user.id]
  );
  const idsMutes = utilisateursMutesData.map(m => m.mutedId);

  let clauseExclusion = "";
  let parametresExclusion = [];
  if (idsMutes.length > 0) {
    clauseExclusion = ` AND n.fromUserId NOT IN (${idsMutes.map(() => '?').join(',')})`;
    parametresExclusion = idsMutes;
  }

  const notifications = await query(`
    SELECT
      n.*,
      u.id as fromUser_id,
      u.displayName as fromUser_displayName
    FROM Notification n
    LEFT JOIN User u ON n.fromUserId = u.id
    WHERE n.toUserId = ?${clauseExclusion}
    ORDER BY n.createdAt DESC
  `, [requete.user.id, ...parametresExclusion]);

  const donneesNotifications = notifications.map(n => ({
    id: n.id,
    type: n.type,
    toUserId: n.toUserId,
    fromUserId: n.fromUserId,
    postId: n.postId,
    commentId: n.commentId,
    friendRequestId: n.friendRequestId,
    eventId: n.eventId,
    readAt: n.readAt,
    createdAt: n.createdAt,
    fromUser: n.fromUser_id ? {
      id: n.fromUser_id,
      displayName: n.fromUser_displayName
    } : null,
    post: null,
    comment: null,
    event: null
  }));

  // Récupérer les invitations de groupe
  const invitationsGroupe = await query(`
    SELECT
      gi.*,
      g.id as group_id,
      g.name as group_name,
      g.description as group_description,
      g.privacy as group_privacy,
      g.ownerId as group_ownerId,
      g.createdAt as group_createdAt,
      u.id as fromUser_id,
      u.displayName as fromUser_displayName
    FROM GroupInvite gi
    JOIN \`Group\` g ON gi.groupId = g.id
    LEFT JOIN User u ON gi.fromUserId = u.id
    WHERE gi.toUserId = ?
    ORDER BY gi.createdAt DESC
  `, [requete.user.id]);

  const donneesInvitationsGroupe = invitationsGroupe.map(gi => ({
    id: gi.id,
    groupId: gi.groupId,
    fromUserId: gi.fromUserId,
    toUserId: gi.toUserId,
    createdAt: gi.createdAt,
    group: {
      id: gi.group_id,
      name: gi.group_name,
      description: gi.group_description,
      privacy: gi.group_privacy,
      ownerId: gi.group_ownerId,
      createdAt: gi.group_createdAt
    },
    fromUser: gi.fromUser_id ? {
      id: gi.fromUser_id,
      displayName: gi.fromUser_displayName
    } : null
  }));

  reponse.render("notifications/index", {
    user: requete.user,
    notifications: donneesNotifications,
    groupInvites: donneesInvitationsGroupe
  });
});

//////////
// Marque toutes les notifications comme lues
// Met à jour readAt pour toutes les notifications non lues
// Retourne: redirect /notifications
//////////
routesNotifications.post("/read-all", exigerAuthentification, async (requete, reponse) => {
  await query(
    "UPDATE Notification SET readAt = NOW() WHERE toUserId = ? AND readAt IS NULL",
    [requete.user.id]
  );

  reponse.redirect("/notifications");
});






