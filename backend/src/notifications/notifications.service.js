import { query, queryOne } from "../db.js";
import { pushToUser } from "../realtime/sse.js";

export async function createNotification({
  type,
  toUserId,
  fromUserId = null,
  postId = null,
  commentId = null,
  friendRequestId = null,
  eventId = null
}) {
  if (fromUserId && toUserId === fromUserId) return;

  const result = await query(
    "INSERT INTO Notification (type, toUserId, fromUserId, postId, commentId, friendRequestId, eventId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
    [type, toUserId, fromUserId, postId, commentId, friendRequestId, eventId]
  );

  const notifId = result.insertId;

  // Récupérer les infos complètes pour SSE
  const notif = await queryOne(`
    SELECT
      n.*,
      u.id as fromUser_id,
      u.displayName as fromUser_displayName,
      e.id as event_id,
      e.title as event_title,
      e.groupId as event_groupId
    FROM Notification n
    LEFT JOIN User u ON n.fromUserId = u.id
    LEFT JOIN Event e ON n.eventId = e.id
    WHERE n.id = ?
  `, [notifId]);

  const unreadCountResult = await queryOne(
    "SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL",
    [toUserId]
  );
  const unreadCount = unreadCountResult ? unreadCountResult.count : 0;

  pushToUser(toUserId, {
    id: notif.id,
    type: notif.type,
    createdAt: notif.createdAt,
    fromUser: notif.fromUser_id ? {
      id: notif.fromUser_id,
      displayName: notif.fromUser_displayName
    } : null,
    event: notif.event_id ? {
      id: notif.event_id,
      title: notif.event_title,
      groupId: notif.event_groupId
    } : null,
    unreadCount
  });

  return notif;
}

export async function markAllRead(toUserId) {
  return query(
    "UPDATE Notification SET readAt = NOW() WHERE toUserId = ? AND readAt IS NULL",
    [toUserId]
  );
}

export async function getUnreadCount(toUserId) {
  const result = await queryOne(
    "SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL",
    [toUserId]
  );
  return result ? result.count : 0;
}
