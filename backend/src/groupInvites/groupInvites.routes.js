import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { createNotification } from "../notifications/notifications.service.js";

export const groupInvitesRouter = express.Router();

/**
 * POST /groups/:groupId/invite/:userId
 * OWNER / ADMIN only
 * -> crée GroupInvite + notif GROUP_INVITE
 */
groupInvitesRouter.post("/groups/:groupId/invite/:userId", requireAuth, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const toUserId = Number(req.params.userId);

  if (!Number.isFinite(groupId) || !Number.isFinite(toUserId)) {
    return res.redirect("/groups");
  }

  const membership = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [groupId, req.user.id]
  );

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return res.status(403).send("Forbidden");
  }

  try {
    await query(
      "INSERT INTO GroupInvite (groupId, fromUserId, toUserId, createdAt) VALUES (?, ?, ?, NOW())",
      [groupId, req.user.id, toUserId]
    );

    await createNotification({
      type: "GROUP_INVITE",
      toUserId,
      fromUserId: req.user.id
    });
  } catch (err) {
    // Ignore si déjà invité
  }

  res.redirect(`/groups/${groupId}`);
});

/**
 * POST /groups/invites/:inviteId/accept
 * -> auto-join + delete invite + notif owner
 */
groupInvitesRouter.post("/groups/invites/:inviteId/accept", requireAuth, async (req, res) => {
  const inviteId = Number(req.params.inviteId);
  if (!Number.isFinite(inviteId)) return res.redirect("/notifications");

  const invite = await queryOne(`
    SELECT
      gi.*,
      g.ownerId as group_ownerId
    FROM GroupInvite gi
    JOIN \`Group\` g ON gi.groupId = g.id
    WHERE gi.id = ?
  `, [inviteId]);

  if (!invite || invite.toUserId !== req.user.id) {
    return res.redirect("/notifications");
  }

  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'MEMBER', NOW())",
    [invite.groupId, req.user.id]
  ).catch(() => {});

  await query("DELETE FROM GroupInvite WHERE id = ?", [inviteId]).catch(() => {});

  await createNotification({
    type: "GROUP_JOIN",
    toUserId: invite.group_ownerId,
    fromUserId: req.user.id
  });

  res.redirect(`/groups/${invite.groupId}`);
});

/**
 * POST /groups/invites/:inviteId/refuse
 * -> delete invite
 */
groupInvitesRouter.post("/groups/invites/:inviteId/refuse", requireAuth, async (req, res) => {
  const inviteId = Number(req.params.inviteId);
  if (!Number.isFinite(inviteId)) return res.redirect("/notifications");

  const invite = await queryOne("SELECT * FROM GroupInvite WHERE id = ?", [inviteId]);

  if (!invite || invite.toUserId !== req.user.id) {
    return res.redirect("/notifications");
  }

  await query("DELETE FROM GroupInvite WHERE id = ?", [inviteId]).catch(() => {});

  res.redirect("/notifications");
});
