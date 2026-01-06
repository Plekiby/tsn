import express from "express";
import crypto from "crypto";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";
import { createNotification } from "../notifications/notifications.service.js";

export const groupInviteLinksRouter = express.Router();

/**
 * POST /groups/:groupId/invite-link
 * OWNER / ADMIN only
 */
groupInviteLinksRouter.post(
  "/groups/:groupId/invite-link",
  requireAuth,
  async (req, res) => {
    const groupId = Number(req.params.groupId);
    if (!Number.isFinite(groupId)) return res.redirect("/groups");

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } }
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return res.status(403).send("Forbidden");
    }

    const token = crypto.randomBytes(24).toString("hex");

    await prisma.groupInviteLink.create({
      data: {
        token,
        groupId
        // expiresAt optionnel (tu peux l’ajouter plus tard)
      }
    });

    res.redirect(`/groups/${groupId}?inviteToken=${token}`);
  }
);

/**
 * GET /groups/invite/accept?token=xxx
 */
groupInviteLinksRouter.get(
  "/groups/invite/accept",
  requireAuth,
  async (req, res) => {
    const token = String(req.query.token || "");
    if (!token) return res.redirect("/groups");

    const invite = await prisma.groupInviteLink.findUnique({
      where: { token },
      include: { group: true }
    });

    if (!invite) return res.redirect("/groups");

    // join group
    await prisma.groupMember
      .create({
        data: {
          groupId: invite.groupId,
          userId: req.user.id,
          role: "MEMBER"
        }
      })
      .catch(() => {});

    // notif OWNER
    await createNotification({
      type: "GROUP_JOIN",
      toUserId: invite.group.ownerId,
      fromUserId: req.user.id
    });

    res.redirect(`/groups/${invite.groupId}`);
  }
);
