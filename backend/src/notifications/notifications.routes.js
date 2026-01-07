import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";

export const notificationsRouter = express.Router();

/**
 * GET /notifications
 */
notificationsRouter.get("/", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { toUserId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: { select: { id: true, displayName: true } },
      post: true,
      comment: true,
      event: true
    }
  });

  // Invitations "directes" (GroupInvite)
  const groupInvites = await prisma.groupInvite.findMany({
    where: { toUserId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      group: true,
      fromUser: { select: { id: true, displayName: true } }
    }
  });

  res.render("notifications/index", {
    user: req.user,
    notifications,
    groupInvites
  });
});

/**
 * POST /notifications/read-all
 */
notificationsRouter.post("/read-all", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { toUserId: req.user.id, readAt: null },
    data: { readAt: new Date() }
  });

  res.redirect("/notifications");
});
