import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { createNotification } from "../notifications/notifications.service.js";

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
  const tab = req.query.tab || "followers"; // "followers", "following"
  const userId = req.query.userId ? Number(req.query.userId) : req.user.id;

  if (!Number.isFinite(userId)) {
    return res.redirect("/friends");
  }

  let followers = [];
  let following = [];
  let viewingUser = null;

  // Récupérer les infos de l'utilisateur consulté
  viewingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true }
  });

  if (!viewingUser) {
    return res.redirect("/friends");
  }

  if (tab === "followers") {
    const follows = await prisma.follow.findMany({
      where: { followedId: userId },
      include: { follower: { select: { id: true, displayName: true, avatar: true } } }
    });
    followers = follows.map(f => f.follower);
  } else if (tab === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { followed: { select: { id: true, displayName: true, avatar: true } } }
    });
    following = follows.map(f => f.followed);
  }

  res.render("friends/index", { 
    user: req.user, 
    followers, 
    following,
    tab,
    viewingUserId: userId,
    viewingUserName: viewingUser.displayName
  });
});

friendsRouter.post("/request/:id", requireAuth, async (req, res) => {
  const toUserId = Number(req.params.id);
  const back = req.get("referer") || "/friends";

  if (!Number.isFinite(toUserId) || toUserId === req.user.id) return res.redirect(back);
  if (await areFriends(req.user.id, toUserId)) return res.redirect(back);

  const fr = await prisma.friendRequest
  .create({ data: { fromUserId: req.user.id, toUserId } })
  .catch(() => null);

if (fr) {
  await createNotification({
    type: "FRIEND_REQUEST",
    toUserId,
    fromUserId: req.user.id,
    friendRequestId: fr.id
  });
}


  res.redirect(back);
});

friendsRouter.post("/accept/:requestId", requireAuth, async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) return res.redirect("/friends");

  const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!fr || fr.toUserId !== req.user.id || fr.status !== "PENDING") return res.redirect("/friends");

  await prisma.friendRequest.update({ where: { id: requestId }, data: { status: "ACCEPTED" } });
await createNotification({
  type: "FRIEND_ACCEPTED",
  toUserId: fr.fromUserId,
  fromUserId: req.user.id,
  friendRequestId: fr.id
});

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
