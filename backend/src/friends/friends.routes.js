import express from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { createNotification } from "../notifications/notifications.service.js";

export const friendsRouter = express.Router();

function pair(a, b) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

async function areFriends(userId1, userId2) {
  const { userAId, userBId } = pair(userId1, userId2);
  const fs = await queryOne(
    "SELECT * FROM Friendship WHERE userAId = ? AND userBId = ?",
    [userAId, userBId]
  );
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
  viewingUser = await queryOne(
    "SELECT id, displayName FROM User WHERE id = ?",
    [userId]
  );

  if (!viewingUser) {
    return res.redirect("/friends");
  }

  if (tab === "followers") {
    followers = await query(`
      SELECT u.id, u.displayName, u.avatar
      FROM Follow f
      JOIN User u ON f.followerId = u.id
      WHERE f.followedId = ?
    `, [userId]);
  } else if (tab === "following") {
    following = await query(`
      SELECT u.id, u.displayName, u.avatar
      FROM Follow f
      JOIN User u ON f.followedId = u.id
      WHERE f.followerId = ?
    `, [userId]);
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

  try {
    const result = await query(
      "INSERT INTO FriendRequest (fromUserId, toUserId, status, createdAt) VALUES (?, ?, 'PENDING', NOW())",
      [req.user.id, toUserId]
    );

    await createNotification({
      type: "FRIEND_REQUEST",
      toUserId,
      fromUserId: req.user.id,
      friendRequestId: result.insertId
    });
  } catch (err) {
    // Ignore si déjà existe
  }


  res.redirect(back);
});

friendsRouter.post("/accept/:requestId", requireAuth, async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) return res.redirect("/friends");

  const fr = await queryOne(
    "SELECT * FROM FriendRequest WHERE id = ?",
    [requestId]
  );
  if (!fr || fr.toUserId !== req.user.id || fr.status !== "PENDING") return res.redirect("/friends");

  await query(
    "UPDATE FriendRequest SET status = 'ACCEPTED' WHERE id = ?",
    [requestId]
  );

  await createNotification({
    type: "FRIEND_ACCEPTED",
    toUserId: fr.fromUserId,
    fromUserId: req.user.id,
    friendRequestId: fr.id
  });

  const { userAId, userBId } = pair(fr.fromUserId, fr.toUserId);
  await query(
    "INSERT INTO Friendship (userAId, userBId) VALUES (?, ?)",
    [userAId, userBId]
  ).catch(() => {});

  res.redirect("/friends");
});

friendsRouter.post("/reject/:requestId", requireAuth, async (req, res) => {
  const requestId = Number(req.params.requestId);
  if (!Number.isFinite(requestId)) return res.redirect("/friends");

  const fr = await queryOne(
    "SELECT * FROM FriendRequest WHERE id = ?",
    [requestId]
  );
  if (!fr || fr.toUserId !== req.user.id || fr.status !== "PENDING") return res.redirect("/friends");

  await query(
    "UPDATE FriendRequest SET status = 'REJECTED' WHERE id = ?",
    [requestId]
  );
  res.redirect("/friends");
});
