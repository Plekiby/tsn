import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";
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

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } }
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return res.status(403).send("Forbidden");
  }

  await prisma.groupInvite
    .create({
      data: {
        groupId,
        fromUserId: req.user.id,
        toUserId
      }
    })
    .catch(() => {});

  await createNotification({
    type: "GROUP_INVITE",
    toUserId,
    fromUserId: req.user.id
  });

  res.redirect(`/groups/${groupId}`);
});

/**
 * POST /groups/invites/:inviteId/accept
 * -> auto-join + delete invite + notif owner
 */
groupInvitesRouter.post("/groups/invites/:inviteId/accept", requireAuth, async (req, res) => {
  const inviteId = Number(req.params.inviteId);
  if (!Number.isFinite(inviteId)) return res.redirect("/notifications");

  const invite = await prisma.groupInvite.findUnique({
    where: { id: inviteId },
    include: { group: true }
  });

  if (!invite || invite.toUserId !== req.user.id) {
    return res.redirect("/notifications");
  }

  await prisma.groupMember
    .create({
      data: { groupId: invite.groupId, userId: req.user.id, role: "MEMBER" }
    })
    .catch(() => {});

  await prisma.groupInvite.delete({ where: { id: inviteId } }).catch(() => {});

  await createNotification({
    type: "GROUP_JOIN",
    toUserId: invite.group.ownerId,
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

  const invite = await prisma.groupInvite.findUnique({ where: { id: inviteId } });

  if (!invite || invite.toUserId !== req.user.id) {
    return res.redirect("/notifications");
  }

  await prisma.groupInvite.delete({ where: { id: inviteId } }).catch(() => {});

  res.redirect("/notifications");
});
