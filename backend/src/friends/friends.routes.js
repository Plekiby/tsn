import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

export const friendsRouter = express.Router();

function pair(a, b) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

async function areFriends(userId1, userId2) {
  const { userAId, userBId } = pair(userId1, userId2);
  const fs = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId, userBId } }
  });
  return !!fs;
}

friendsRouter.get("/", requireAuth, async (req, res) => {
  const incoming = await prisma.friendRequest.findMany({
    where: { toUserId: req.user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { fromUser: { select: { id: true, displayName: true } } }
  });

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] },
    include: {
      userA: { select: { id: true, displayName: true } },
      userB: { select: { id: true, displayName: true } }
    }
  });

  const friends = friendships.map(f => (f.userAId === req.user.id ? f.userB : f.userA));
  res.render("friends/index", { user: req.user, incoming, friends });
});

friendsRouter.post("/request/:id", requireAuth, async (req, res) => {
  const toUserId = Number(req.params.id);
  const back = req.get("referer") || "/friends";

  if (!Number.isFinite(toUserId) || toUserId === req.user.id) return res.redirect(back);
  if (await areFriends(req.user.id, toUserId)) return res.redirect(back);

  await prisma.friendRequest
    .create({ data: { fromUserId: req.user.id, toUserId } })
    .catch(() => {});

  res.redirect(back);
});

friendsRouter.post("/accept/:requestId", requireAuth, async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) return res.redirect("/friends");

  const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!fr || fr.toUserId !== req.user.id || fr.status !== "PENDING") return res.redirect("/friends");

  await prisma.friendRequest.update({ where: { id: requestId }, data: { status: "ACCEPTED" } });

  const { userAId, userBId } = pair(fr.fromUserId, fr.toUserId);
  await prisma.friendship.create({ data: { userAId, userBId } }).catch(() => {});

  res.redirect("/friends");
});

friendsRouter.post("/reject/:requestId", requireAuth, async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) return res.redirect("/friends");

  const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!fr || fr.toUserId !== req.user.id || fr.status !== "PENDING") return res.redirect("/friends");

  await prisma.friendRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });
  res.redirect("/friends");
});
