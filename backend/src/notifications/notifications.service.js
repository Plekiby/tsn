import { prisma } from "../prisma.js";
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

  const notif = await prisma.notification.create({
    data: {
      type,
      toUserId,
      fromUserId,
      postId,
      commentId,
      friendRequestId,
      eventId
    },
    include: {
      fromUser: { select: { id: true, displayName: true } },
      event: { select: { id: true, title: true, groupId: true } }
    }
  });

  const unreadCount = await prisma.notification.count({
    where: { toUserId, readAt: null }
  });

  pushToUser(toUserId, {
    id: notif.id,
    type: notif.type,
    createdAt: notif.createdAt,
    fromUser: notif.fromUser,
    event: notif.event
      ? { id: notif.event.id, title: notif.event.title, groupId: notif.event.groupId }
      : null,
    unreadCount
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
