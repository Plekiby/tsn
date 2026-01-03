import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";

export const notificationsRouter = express.Router();

// GET /notifications
notificationsRouter.get("/", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { toUserId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromUser: { select: { id: true, displayName: true } },
      post: { select: { id: true, content: true } },
      comment: { select: { id: true, content: true } }
    }
  });

  res.render("notifications/index", { user: req.user, notifications });
});

// POST /notifications/read-all
notificationsRouter.post("/read-all", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { toUserId: req.user.id, readAt: null },
    data: { readAt: new Date() }
  });

  res.redirect("/notifications");
});
