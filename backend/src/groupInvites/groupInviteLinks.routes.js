import express from "express";
import crypto from "crypto";
import { requireAuth } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { createNotification } from "../notifications/notifications.service.js";

export const groupInviteLinksRouter = express.Router();

/**
 * POST /groups/:groupId/invite-link
 * OWNER / ADMIN only
 * -> génère un token + redirect vers /groups/:id?inviteToken=...
 */
groupInviteLinksRouter.post("/groups/:groupId/invite-link", requireAuth, async (req, res) => {
  const groupId = Number(req.params.groupId);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const membership = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [groupId, req.user.id]
  );

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return res.status(403).send("Forbidden");
  }

  const token = crypto.randomBytes(24).toString("hex");

  await query(
    "INSERT INTO GroupInviteLink (token, groupId, createdAt) VALUES (?, ?, NOW())",
    [token, groupId]
  );

  res.redirect(`/groups/${groupId}?inviteToken=${token}`);
});

/**
 * GET /groups/invite/accept?token=xxx
 * requireAuth: si pas connecté -> tu peux gérer plus tard avec redirect login
 */
groupInviteLinksRouter.get("/groups/invite/accept", requireAuth, async (req, res) => {
  const token = String(req.query.token || "");
  if (!token) return res.redirect("/groups");

  const invite = await queryOne(`
    SELECT
      gil.*,
      g.ownerId as group_ownerId
    FROM GroupInviteLink gil
    JOIN \`Group\` g ON gil.groupId = g.id
    WHERE gil.token = ?
  `, [token]);

  if (!invite) return res.redirect("/groups");

  // join group
  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'MEMBER', NOW())",
    [invite.groupId, req.user.id]
  ).catch(() => {});

  // notif OWNER
  await createNotification({
    type: "GROUP_JOIN",
    toUserId: invite.group_ownerId,
    fromUserId: req.user.id
  });

  res.redirect(`/groups/${invite.groupId}`);
});
