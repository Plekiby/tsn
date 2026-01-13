import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
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

  const ev = await queryOne(
    "SELECT id, groupId, creatorId FROM Event WHERE id = ?",
    [eventId]
  );
  if (!ev) return res.redirect("/posts/feed");

  // membership gate
  const member = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [ev.groupId, req.user.id]
  );
  if (!member) return res.status(403).send("Forbidden");

  // Upsert: vérifier si existe déjà
  const existing = await queryOne(
    "SELECT * FROM EventAttendee WHERE eventId = ? AND userId = ?",
    [eventId, req.user.id]
  );

  if (existing) {
    await query(
      "UPDATE EventAttendee SET status = ? WHERE eventId = ? AND userId = ?",
      [safeStatus, eventId, req.user.id]
    );
  } else {
    await query(
      "INSERT INTO EventAttendee (eventId, userId, status) VALUES (?, ?, ?)",
      [eventId, req.user.id, safeStatus]
    );
  }

  // Récupérer le nombre de participants GOING
  const goingCountResult = await queryOne(
    "SELECT COUNT(*) as count FROM EventAttendee WHERE eventId = ? AND status = 'GOING'",
    [eventId]
  );
  const goingCount = goingCountResult ? goingCountResult.count : 0;

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
