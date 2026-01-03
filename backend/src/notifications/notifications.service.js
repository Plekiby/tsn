import { prisma } from "../prisma.js";
import { pushToUser } from "../realtime/sse.js";

export async function createNotification({
  type,
  toUserId,
  fromUserId = null,
  postId = null,
  commentId = null,
  friendRequestId = null
}) {
  if (fromUserId && toUserId === fromUserId) return;

  const notif = await prisma.notification.create({
    data: {
      type,
      toUserId,
      fromUserId,
      postId,
      commentId,
      friendRequestId
    },
    include: {
      fromUser: { select: { id: true, displayName: true } }
    }
  });

  // 🔥 PUSH TEMPS RÉEL
  pushToUser(toUserId, {
    id: notif.id,
    type: notif.type,
    fromUser: notif.fromUser,
    createdAt: notif.createdAt
  });

  return notif;
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
