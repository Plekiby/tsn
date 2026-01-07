import { prisma } from "../prisma.js";

export async function attachUnreadMessages(req, res, next) {
  if (!req.user?.id) {
    res.locals.unreadMessages = 0;
    return next();
  }

  try {
    const members = await prisma.conversationMember.findMany({
      where: { userId: req.user.id },
      include: {
        conversation: {
          include: {
            messages: {
              where: {
                senderId: { not: req.user.id }
              },
              orderBy: { createdAt: "desc" },
              take: 1
            }
          }
        }
      }
    });

    let total = 0;
    for (const member of members) {
      const lastMsg = member.conversation.messages[0];
      if (lastMsg && (!member.lastReadAt || lastMsg.createdAt > member.lastReadAt)) {
        total++;
      }
    }

    res.locals.unreadMessages = total;
  } catch (err) {
    res.locals.unreadMessages = 0;
  }

  next();
}
