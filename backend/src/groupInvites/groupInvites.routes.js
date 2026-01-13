import express from "express";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { creerNotification } from "../notifications/notifications.service.js";

export const routesInvitationsGroupes = express.Router();

//////////
// Invite un utilisateur à rejoindre un groupe
// Seuls OWNER ou ADMIN peuvent inviter
// Crée une notification GROUP_INVITE à l'utilisateur
// Retourne: redirect /groups/:id
//////////
routesInvitationsGroupes.post("/groups/:groupId/invite/:userId", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.groupId);
  const idUtilisateurCible = Number(requete.params.userId);

  if (!Number.isFinite(idGroupe) || !Number.isFinite(idUtilisateurCible)) {
    return reponse.redirect("/groups");
  }

  const adhesion = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [idGroupe, requete.user.id]
  );

  if (!adhesion || !["OWNER", "ADMIN"].includes(adhesion.role)) {
    return reponse.status(403).send("Forbidden");
  }

  try {
    await query(
      "INSERT INTO GroupInvite (groupId, fromUserId, toUserId, createdAt) VALUES (?, ?, ?, NOW())",
      [idGroupe, requete.user.id, idUtilisateurCible]
    );

    await creerNotification({
      type: "GROUP_INVITE",
      toUserId: idUtilisateurCible,
      fromUserId: requete.user.id
    });
  } catch (err) {
    // Ignore si déjà invité
  }

  reponse.redirect(`/groups/${idGroupe}`);
});

//////////
// Accepte une invitation de groupe
// Crée l'adhésion (MEMBER), supprime l'invitation
// Notifie le propriétaire du groupe
// Retourne: redirect /groups/:id
//////////
routesInvitationsGroupes.post("/groups/invites/:inviteId/accept", exigerAuthentification, async (requete, reponse) => {
  const idInvitation = Number(requete.params.inviteId);
  if (!Number.isFinite(idInvitation)) return reponse.redirect("/notifications");

  const invitation = await queryOne(`
    SELECT
      gi.*,
      g.ownerId as group_ownerId
    FROM GroupInvite gi
    JOIN \`Group\` g ON gi.groupId = g.id
    WHERE gi.id = ?
  `, [idInvitation]);

  if (!invitation || invitation.toUserId !== requete.user.id) {
    return reponse.redirect("/notifications");
  }

  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'MEMBER', NOW())",
    [invitation.groupId, requete.user.id]
  ).catch(() => {});

  await query("DELETE FROM GroupInvite WHERE id = ?", [idInvitation]).catch(() => {});

  await creerNotification({
    type: "GROUP_JOIN",
    toUserId: invitation.group_ownerId,
    fromUserId: requete.user.id
  });

  reponse.redirect(`/groups/${invitation.groupId}`);
});

//////////
// Refuse une invitation de groupe
// Supprime simplement l'invitation
// Retourne: redirect /notifications
//////////
routesInvitationsGroupes.post("/groups/invites/:inviteId/refuse", exigerAuthentification, async (requete, reponse) => {
  const idInvitation = Number(requete.params.inviteId);
  if (!Number.isFinite(idInvitation)) return reponse.redirect("/notifications");

  const invitation = await queryOne("SELECT * FROM GroupInvite WHERE id = ?", [idInvitation]);

  if (!invitation || invitation.toUserId !== requete.user.id) {
    return reponse.redirect("/notifications");
  }

  await query("DELETE FROM GroupInvite WHERE id = ?", [idInvitation]).catch(() => {});

  reponse.redirect("/notifications");
});






