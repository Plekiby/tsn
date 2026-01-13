import express from "express";
import crypto from "crypto";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { creerNotification } from "../notifications/notifications.service.js";

export const routesLiensInvitationsGroupes = express.Router();

//////////
// Génère un lien d'invitation pour un groupe
// Seuls OWNER ou ADMIN peuvent créer les liens
// Génère un token crypto aléatoire
// Retourne: redirect /groups/:id?inviteToken=TOKEN
//////////
routesLiensInvitationsGroupes.post("/groups/:groupId/invite-link", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.groupId);
  if (!Number.isFinite(idGroupe)) return reponse.redirect("/groups");

  const adhesion = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [idGroupe, requete.user.id]
  );

  if (!adhesion || !["OWNER", "ADMIN"].includes(adhesion.role)) {
    return reponse.status(403).send("Forbidden");
  }

  const jeton = crypto.randomBytes(24).toString("hex");

  await query(
    "INSERT INTO GroupInviteLink (token, groupId, createdAt) VALUES (?, ?, NOW())",
    [jeton, idGroupe]
  );

  reponse.redirect(`/groups/${idGroupe}?inviteToken=${jeton}`);
});

//////////
// Accepte une invitation via lien jeton
// Crée l'adhésion au groupe (MEMBER)
// Notifie le propriétaire du groupe
// Retourne: redirect /groups/:id
//////////
routesLiensInvitationsGroupes.get("/groups/invite/accept", exigerAuthentification, async (requete, reponse) => {
  const jeton = String(requete.query.token || "");
  if (!jeton) return reponse.redirect("/groups");

  const invitation = await queryOne(`
    SELECT
      gil.*,
      g.ownerId as group_ownerId
    FROM GroupInviteLink gil
    JOIN \`Group\` g ON gil.groupId = g.id
    WHERE gil.token = ?
  `, [jeton]);

  if (!invitation) return reponse.redirect("/groups");

  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'MEMBER', NOW())",
    [invitation.groupId, requete.user.id]
  ).catch(() => {});

  await creerNotification({
    type: "GROUP_JOIN",
    toUserId: invitation.group_ownerId,
    fromUserId: requete.user.id
  });

  reponse.redirect(`/groups/${invitation.groupId}`);
});






