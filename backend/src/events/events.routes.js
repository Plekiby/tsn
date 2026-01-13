import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";
import { createNotification } from "../notifications/notifications.service.js";

export const eventsRouter = express.Router();

/**
 * POST /events/:id/rsvp
 * body: { status: GOING|DECLINED }
 *
 * Règles:
 * - être membre du groupe de l'event
 * - upsert EventAttendee
 * - notif au creator: EVENT_RSVP (sauf si creator lui-même)
 */
eventsRouter.post("/:id/rsvp", requireAuth, async (req, res) => {
  const eventId = Number(req.params.id);
  const status = String(req.body?.status || "GOING").toUpperCase();

  const allowed = new Set(["GOING", "DECLINED"]);
  const safeStatus = allowed.has(status) ? status : "GOING";

  if (!Number.isFinite(eventId)) return res.redirect("/posts/feed");

  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      groupId: true,
      creatorId: true
    }
  });
  if (!ev) return res.redirect("/posts/feed");

  // membership gate
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: ev.groupId, userId: req.user.id } }
  });
  if (!member) return res.status(403).send("Forbidden");

  await prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId: req.user.id } },
    update: { status: safeStatus },
    create: { eventId, userId: req.user.id, status: safeStatus }
  });

  // Récupérer le nombre de participants GOING
  const goingCount = await prisma.eventAttendee.count({
    where: { eventId, status: "GOING" }
  });

  // notif au creator (si pas lui-même)
  if (ev.creatorId !== req.user.id) {
    await createNotification({
      type: "EVENT_RSVP",
      toUserId: ev.creatorId,
      fromUserId: req.user.id,
      eventId: ev.id
    });
  }

  // Si AJAX, retourner JSON
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.json({ success: true, goingCount, status: safeStatus });
  }

  res.redirect(`/groups/${ev.groupId}`);
});
