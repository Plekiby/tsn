import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { broadcastMessage } from "../realtime/sse.js";

export const messagesRouter = express.Router();

/**
 * Page: liste des conversations
 */
messagesRouter.get("/", requireAuth, async (req, res) => {
  const convs = await prisma.conversationMember.findMany({
    where: { userId: req.user.id },
    include: {
      conversation: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, displayName: true, avatar: true }
              }
            }
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: { displayName: true }
              }
            }
          },
          group: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              messages: true
            }
          }
        }
      }
    },
    orderBy: {
      conversation: { updatedAt: "desc" }
    }
  });

  const conversations = await Promise.all(convs.map(async cm => {
    const conv = cm.conversation;
    const otherMembers = conv.members.filter(m => m.userId !== req.user.id);
    const lastMsg = conv.messages[0];

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conv.id,
        senderId: { not: req.user.id },
        createdAt: {
          gt: cm.lastReadAt || new Date(0)
        }
      }
    });

    return {
      id: conv.id,
      isGroup: !!conv.groupId,
      groupName: conv.group?.name,
      otherMembers: otherMembers.map(m => m.user),
      lastMessage: lastMsg,
      unreadCount,
      updatedAt: conv.updatedAt
    };
  }));

  res.render("messages/index", { user: req.user, conversations });
});

/**
 * Action: démarrer une conversation avec un user
 */
messagesRouter.post("/start/:userId", requireAuth, async (req, res) => {
  const otherUserId = Number(req.params.userId);
  if (!Number.isFinite(otherUserId) || otherUserId === req.user.id) {
    return res.redirect("/messages");
  }

  const ids = [req.user.id, otherUserId].sort((a, b) => a - b);

  let conv = await prisma.conversation.findFirst({
    where: {
      groupId: null,
      members: {
        every: {
          userId: { in: ids }
        }
      }
    },
    include: {
      members: true
    }
  });

  if (!conv || conv.members.length !== 2) {
    conv = await prisma.conversation.create({
      data: {
        members: {
          create: ids.map(id => ({ userId: id }))
        }
      }
    });
  }

  res.redirect(`/messages/${conv.id}`);
});

/**
 * Page: afficher une conversation
 */
messagesRouter.get("/:id", requireAuth, async (req, res) => {
  const convId = Number(req.params.id);
  if (!Number.isFinite(convId)) {
    return res.redirect("/messages");
  }

  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId: convId,
        userId: req.user.id
      }
    }
  });

  if (!member) {
    return res.redirect("/messages");
  }

  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, avatar: true }
          }
        }
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          sender: {
            select: { id: true, displayName: true, avatar: true }
          }
        }
      },
      group: {
        select: { id: true, name: true }
      }
    }
  });

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId: convId,
        userId: req.user.id
      }
    },
    data: { lastReadAt: new Date() }
  });

  const otherMembers = conv.members.filter(m => m.userId !== req.user.id);

  res.render("messages/conversation", {
    user: req.user,
    conversation: conv,
    otherMembers: otherMembers.map(m => m.user),
    isGroup: !!conv.groupId,
    groupName: conv.group?.name
  });
});

/**
 * Action: envoyer un message
 */
messagesRouter.post("/:id/send", requireAuth, async (req, res) => {
  const convId = Number(req.params.id);
  const content = req.body.content?.trim();

  if (!Number.isFinite(convId) || !content) {
    return res.redirect(`/messages/${convId}`);
  }

  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId: convId,
        userId: req.user.id
      }
    }
  });

  if (!member) {
    return res.redirect("/messages");
  }

  const msg = await prisma.message.create({
    data: {
      content,
      conversationId: convId,
      senderId: req.user.id
    },
    include: {
      sender: {
        select: { id: true, displayName: true, avatar: true }
      }
    }
  });

  await prisma.conversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() }
  });

  const members = await prisma.conversationMember.findMany({
    where: { conversationId: convId },
    select: { userId: true }
  });

  members.forEach(m => {
    if (m.userId !== req.user.id) {
      broadcastMessage(m.userId, {
        type: "new_message",
        conversationId: convId,
        message: msg
      });
    }
  });

  res.redirect(`/messages/${convId}`);
});
