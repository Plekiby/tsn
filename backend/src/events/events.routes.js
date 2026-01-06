import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";

export const eventsRouter = express.Router();

async function isMember(groupId, userId) {
  const gm = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  return !!gm;
}

eventsRouter.post("/groups/:groupId/events", requireAuth, async (req, res) => {
  const groupId = Number(req.params.groupId);
  const title = (req.body?.title || "").trim();
  const description = (req.body?.description || "").trim();
  const location = (req.body?.location || "").trim();
  const startAt = req.body?.startAt ? new Date(req.body.startAt) : null;
  const endAt = req.body?.endAt ? new Date(req.body.endAt) : null;

  if (!Number.isFinite(groupId)) return res.redirect("/groups");
  if (!title || !startAt || isNaN(startAt.getTime())) return res.redirect(`/groups/${groupId}`);

  const member = await isMember(groupId, req.user.id);
  if (!member) return res.status(403).send("Forbidden");

  await prisma.event.create({
    data: {
      title,
      description: description || null,
      location: location || null,
      startAt,
      endAt: endAt && !isNaN(endAt.getTime()) ? endAt : null,
      groupId,
      creatorId: req.user.id
    }
  });

  res.redirect(`/groups/${groupId}`);
});

eventsRouter.post("/events/:eventId/rsvp", requireAuth, async (req, res) => {
  const eventId = Number(req.params.eventId);
  const status = String(req.body?.status || "GOING").toUpperCase();
  const allowed = new Set(["GOING", "INTERESTED", "DECLINED"]);
  const safeStatus = allowed.has(status) ? status : "GOING";

  if (!Number.isFinite(eventId)) return res.redirect("/groups");

  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, groupId: true }
  });
  if (!ev) return res.redirect("/groups");

  const member = await isMember(ev.groupId, req.user.id);
  if (!member) return res.status(403).send("Forbidden");

  await prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId: req.user.id } },
    update: { status: safeStatus },
    create: { eventId, userId: req.user.id, status: safeStatus }
  });

  res.redirect(`/groups/${ev.groupId}`);
});
