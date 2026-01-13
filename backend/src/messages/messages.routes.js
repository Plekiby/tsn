import express from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { broadcastMessage } from "../realtime/sse.js";

export const messagesRouter = express.Router();

/**
 * Page: liste des conversations
 */
messagesRouter.get("/", requireAuth, async (req, res) => {
  // Récupérer toutes les conversations de l'utilisateur
  const convMembers = await query(`
    SELECT
      cm.*,
      c.id as conv_id,
      c.groupId as conv_groupId,
      c.createdAt as conv_createdAt,
      c.updatedAt as conv_updatedAt
    FROM ConversationMember cm
    JOIN Conversation c ON cm.conversationId = c.id
    WHERE cm.userId = ?
    ORDER BY c.updatedAt DESC
  `, [req.user.id]);

  const conversations = [];

  for (const cm of convMembers) {
    const convId = cm.conv_id;

    // Récupérer les autres membres
    const allMembers = await query(`
      SELECT
        cm.userId,
        u.id as user_id,
        u.displayName as user_displayName,
        u.avatar as user_avatar
      FROM ConversationMember cm
      JOIN User u ON cm.userId = u.id
      WHERE cm.conversationId = ?
    `, [convId]);

    const otherMembers = allMembers
      .filter(m => m.userId !== req.user.id)
      .map(m => ({
        id: m.user_id,
        displayName: m.user_displayName,
        avatar: m.user_avatar
      }));

    // Dernier message
    const lastMsg = await queryOne(`
      SELECT
        m.*,
        u.displayName as sender_displayName
      FROM Message m
      LEFT JOIN User u ON m.senderId = u.id
      WHERE m.conversationId = ?
      ORDER BY m.createdAt DESC
      LIMIT 1
    `, [convId]);

    // Compter les messages non lus
    const unreadCountResult = await queryOne(`
      SELECT COUNT(*) as count
      FROM Message
      WHERE conversationId = ?
        AND senderId != ?
        AND createdAt > ?
    `, [convId, req.user.id, cm.lastReadAt || new Date(0)]);

    const unreadCount = unreadCountResult ? unreadCountResult.count : 0;

    // Récupérer le groupe si nécessaire
    let groupName = null;
    if (cm.conv_groupId) {
      const grp = await queryOne("SELECT name FROM `Group` WHERE id = ?", [cm.conv_groupId]);
      groupName = grp ? grp.name : null;
    }

    conversations.push({
      id: convId,
      isGroup: !!cm.conv_groupId,
      groupName,
      otherMembers,
      lastMessage: lastMsg ? {
        id: lastMsg.id,
        content: lastMsg.content,
        createdAt: lastMsg.createdAt,
        sender: {
          displayName: lastMsg.sender_displayName
        }
      } : null,
      unreadCount,
      updatedAt: cm.conv_updatedAt
    });
  }

  res.render("messages/index", { user: req.user, conversations });
});

/**
 * Action: démarrer une conversation avec un user
 */
messagesRouter.post("/start/:userId", requireAuth, async (req, res) => {
  const otherUserId = Number(req.params.userId);
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';

  if (!Number.isFinite(otherUserId) || otherUserId === req.user.id) {
    return isAjax ? res.json({ error: "Invalid user ID" }) : res.redirect("/messages");
  }

  // Vérifier si l'utilisateur peut recevoir des messages
  const otherUserPrivacy = await queryOne(
    "SELECT canReceiveMessages FROM UserPrivacy WHERE userId = ?",
    [otherUserId]
  );

  if (otherUserPrivacy && !otherUserPrivacy.canReceiveMessages) {
    return res.json({
      error: "Cet utilisateur n'accepte pas les messages directs",
      blocked: true
    });
  }

  const ids = [req.user.id, otherUserId].sort((a, b) => a - b);

  // Chercher si une conversation existe déjà entre ces 2 users
  const existingConvs = await query(`
    SELECT DISTINCT c.id
    FROM Conversation c
    WHERE c.groupId IS NULL
      AND EXISTS (SELECT 1 FROM ConversationMember WHERE conversationId = c.id AND userId = ?)
      AND EXISTS (SELECT 1 FROM ConversationMember WHERE conversationId = c.id AND userId = ?)
  `, [ids[0], ids[1]]);

  let convId = null;

  if (existingConvs.length > 0) {
    // Vérifier que c'est bien une conv à 2 personnes
    const memberCount = await queryOne(
      "SELECT COUNT(*) as count FROM ConversationMember WHERE conversationId = ?",
      [existingConvs[0].id]
    );
    if (memberCount && memberCount.count === 2) {
      convId = existingConvs[0].id;
    }
  }

  if (!convId) {
    // Créer une nouvelle conversation
    const result = await query("INSERT INTO Conversation (createdAt, updatedAt) VALUES (NOW(), NOW())");
    convId = result.insertId;

    // Ajouter les 2 membres
    await query(
      "INSERT INTO ConversationMember (conversationId, userId) VALUES (?, ?), (?, ?)",
      [convId, ids[0], convId, ids[1]]
    );
  }

  if (isAjax) {
    res.json({ conversationId: convId });
  } else {
    res.redirect(`/messages/${convId}`);
  }
});

/**
 * Page: afficher une conversation
 */
messagesRouter.get("/:id", requireAuth, async (req, res) => {
  const convId = Number(req.params.id);
  if (!Number.isFinite(convId)) {
    return res.redirect("/messages");
  }

  const member = await queryOne(
    "SELECT * FROM ConversationMember WHERE conversationId = ? AND userId = ?",
    [convId, req.user.id]
  );

  if (!member) {
    return res.redirect("/messages");
  }

  // Récupérer la conversation
  const conv = await queryOne("SELECT * FROM Conversation WHERE id = ?", [convId]);

  // Récupérer tous les membres
  const allMembers = await query(`
    SELECT
      cm.userId,
      u.id as user_id,
      u.displayName as user_displayName,
      u.avatar as user_avatar
    FROM ConversationMember cm
    JOIN User u ON cm.userId = u.id
    WHERE cm.conversationId = ?
  `, [convId]);

  const otherMembers = allMembers
    .filter(m => m.userId !== req.user.id)
    .map(m => ({
      id: m.user_id,
      displayName: m.user_displayName,
      avatar: m.user_avatar
    }));

  // Récupérer les messages
  const messages = await query(`
    SELECT
      m.*,
      u.id as sender_id,
      u.displayName as sender_displayName,
      u.avatar as sender_avatar
    FROM Message m
    LEFT JOIN User u ON m.senderId = u.id
    WHERE m.conversationId = ?
    ORDER BY m.createdAt ASC
    LIMIT 100
  `, [convId]);

  const messagesData = messages.map(m => ({
    id: m.id,
    content: m.content,
    conversationId: m.conversationId,
    senderId: m.senderId,
    createdAt: m.createdAt,
    sender: {
      id: m.sender_id,
      displayName: m.sender_displayName,
      avatar: m.sender_avatar
    }
  }));

  // Marquer comme lu
  await query(
    "UPDATE ConversationMember SET lastReadAt = NOW() WHERE conversationId = ? AND userId = ?",
    [convId, req.user.id]
  );

  // Récupérer le groupe si nécessaire
  let groupName = null;
  if (conv.groupId) {
    const grp = await queryOne("SELECT name FROM `Group` WHERE id = ?", [conv.groupId]);
    groupName = grp ? grp.name : null;
  }

  res.render("messages/conversation", {
    user: req.user,
    conversation: {
      id: conv.id,
      groupId: conv.groupId,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      members: allMembers,
      messages: messagesData,
      group: conv.groupId ? { id: conv.groupId, name: groupName } : null
    },
    otherMembers,
    isGroup: !!conv.groupId,
    groupName
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

  const member = await queryOne(
    "SELECT * FROM ConversationMember WHERE conversationId = ? AND userId = ?",
    [convId, req.user.id]
  );

  if (!member) {
    return res.redirect("/messages");
  }

  const result = await query(
    "INSERT INTO Message (content, conversationId, senderId, createdAt) VALUES (?, ?, ?, NOW())",
    [content, convId, req.user.id]
  );

  const msgId = result.insertId;

  await query(
    "UPDATE Conversation SET updatedAt = NOW() WHERE id = ?",
    [convId]
  );

  // Récupérer le message complet avec le sender
  const msg = await queryOne(`
    SELECT
      m.*,
      u.id as sender_id,
      u.displayName as sender_displayName,
      u.avatar as sender_avatar
    FROM Message m
    LEFT JOIN User u ON m.senderId = u.id
    WHERE m.id = ?
  `, [msgId]);

  // Récupérer les membres pour broadcaster
  const members = await query(
    "SELECT userId FROM ConversationMember WHERE conversationId = ?",
    [convId]
  );

  members.forEach(m => {
    if (m.userId !== req.user.id) {
      broadcastMessage(m.userId, {
        type: "new_message",
        conversationId: convId,
        message: {
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          sender: {
            id: msg.sender_id,
            displayName: msg.sender_displayName,
            avatar: msg.sender_avatar
          }
        }
      });
    }
  });

  res.redirect(`/messages/${convId}`);
});
