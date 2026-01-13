import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { query } from "../db.js";

export const notificationsRouter = express.Router();

/**
 * GET /notifications
 */
notificationsRouter.get("/", requireAuth, async (req, res) => {
  const notifications = await query(`
    SELECT
      n.*,
      u.id as fromUser_id,
      u.displayName as fromUser_displayName
    FROM Notification n
    LEFT JOIN User u ON n.fromUserId = u.id
    WHERE n.toUserId = ?
    ORDER BY n.createdAt DESC
  `, [req.user.id]);

  const notificationsData = notifications.map(n => ({
    id: n.id,
    type: n.type,
    toUserId: n.toUserId,
    fromUserId: n.fromUserId,
    postId: n.postId,
    commentId: n.commentId,
    friendRequestId: n.friendRequestId,
    eventId: n.eventId,
    readAt: n.readAt,
    createdAt: n.createdAt,
    fromUser: n.fromUser_id ? {
      id: n.fromUser_id,
      displayName: n.fromUser_displayName
    } : null,
    post: null,  // Pourrait être enrichi si nécessaire
    comment: null,
    event: null
  }));

  // Invitations "directes" (GroupInvite)
  const groupInvites = await query(`
    SELECT
      gi.*,
      g.id as group_id,
      g.name as group_name,
      g.description as group_description,
      g.privacy as group_privacy,
      g.ownerId as group_ownerId,
      g.createdAt as group_createdAt,
      u.id as fromUser_id,
      u.displayName as fromUser_displayName
    FROM GroupInvite gi
    JOIN \`Group\` g ON gi.groupId = g.id
    LEFT JOIN User u ON gi.fromUserId = u.id
    WHERE gi.toUserId = ?
    ORDER BY gi.createdAt DESC
  `, [req.user.id]);

  const groupInvitesData = groupInvites.map(gi => ({
    id: gi.id,
    groupId: gi.groupId,
    fromUserId: gi.fromUserId,
    toUserId: gi.toUserId,
    createdAt: gi.createdAt,
    group: {
      id: gi.group_id,
      name: gi.group_name,
      description: gi.group_description,
      privacy: gi.group_privacy,
      ownerId: gi.group_ownerId,
      createdAt: gi.group_createdAt
    },
    fromUser: gi.fromUser_id ? {
      id: gi.fromUser_id,
      displayName: gi.fromUser_displayName
    } : null
  }));

  res.render("notifications/index", {
    user: req.user,
    notifications: notificationsData,
    groupInvites: groupInvitesData
  });
});

/**
 * POST /notifications/read-all
 */
notificationsRouter.post("/read-all", requireAuth, async (req, res) => {
  await query(
    "UPDATE Notification SET readAt = NOW() WHERE toUserId = ? AND readAt IS NULL",
    [req.user.id]
  );

  res.redirect("/notifications");
});
