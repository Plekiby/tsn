import { prisma } from "../prisma.js";

export async function createNotification({
  type,
  toUserId,
  fromUserId = null,
  postId = null,
  commentId = null,
  friendRequestId = null
}) {
  // pas de notif à soi-même
  if (fromUserId && toUserId === fromUserId) return;

  return prisma.notification.create({
    data: {
      type,
      toUserId,
      fromUserId,
      postId,
      commentId,
      friendRequestId
    }
  });
}

export async function markAllRead(toUserId) {
  return prisma.notification.updateMany({
    where: { toUserId, readAt: null },
    data: { readAt: new Date() }
  });
}

export async function getUnreadCount(toUserId) {
  return prisma.notification.count({
    where: { toUserId, readAt: null }
  });
}
