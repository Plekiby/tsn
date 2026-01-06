import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";
import { createNotification } from "../notifications/notifications.service.js";

export const groupInvitesRouter = express.Router();

/**
 * POST /groups/invites/:inviteId/accept
 */
groupInvitesRouter.post(
  "/groups/invites/:inviteId/accept",
  requireAuth,
  async (req, res) => {
    const inviteId = Number(req.params.inviteId);
    if (!Number.isFinite(inviteId)) return res.redirect("/notifications");

    const invite = await prisma.groupInvite.findUnique({
      where: { id: inviteId },
      include: { group: true }
    });

    if (!invite || invite.toUserId !== req.user.id) {
      return res.redirect("/notifications");
    }

    // auto-join
    await prisma.groupMember
      .create({
        data: {
          groupId: invite.groupId,
          userId: req.user.id,
          role: "MEMBER"
        }
      })
      .catch(() => {});

    // delete invite
    await prisma.groupInvite.delete({ where: { id: inviteId } });

    // 🔔 notif OWNER
    await createNotification({
      type: "GROUP_JOIN",
      toUserId: invite.group.ownerId,
      fromUserId: req.user.id
    });

    res.redirect(`/groups/${invite.groupId}`);
  }
);

/**
 * POST /groups/invites/:inviteId/refuse
 */
groupInvitesRouter.post(
  "/groups/invites/:inviteId/refuse",
  requireAuth,
  async (req, res) => {
    const inviteId = Number(req.params.inviteId);
    if (!Number.isFinite(inviteId)) return res.redirect("/notifications");

    const invite = await prisma.groupInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite || invite.toUserId !== req.user.id) {
      return res.redirect("/notifications");
    }

    await prisma.groupInvite.delete({ where: { id: inviteId } });

    res.redirect("/notifications");
  }
);
