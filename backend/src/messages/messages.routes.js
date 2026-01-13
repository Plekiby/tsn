import express from "express";
import { query, queryOne } from "../db.js";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { diffuserMessage } from "../realtime/sse.js";

export const routesMessages = express.Router();

//////////
// Liste toutes les conversations de l'utilisateur authentifié
// Charge les autres membres, dernier message et comptage des non-lus
// Retourne: vue messages/index avec conversations
//////////
routesMessages.get("/", exigerAuthentification, async (requete, reponse) => {
  const adhesionisteConvertion = await query(`
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
  `, [requete.user.id]);

  const conversations = [];

  for (const adhesion of adhesionisteConvertion) {
    const idConversation = adhesion.conv_id;

    const tousLesMembres = await query(`
      SELECT
        cm.userId,
        u.id as user_id,
        u.displayName as user_displayName,
        u.avatar as user_avatar
      FROM ConversationMember cm
      JOIN User u ON cm.userId = u.id
      WHERE cm.conversationId = ?
    `, [idConversation]);

    const autreMembres = tousLesMembres
      .filter(m => m.userId !== requete.user.id)
      .map(m => ({
        id: m.user_id,
        displayName: m.user_displayName,
        avatar: m.user_avatar
      }));

    const dernierMessage = await queryOne(`
      SELECT
        m.*,
        u.displayName as sender_displayName
      FROM Message m
      LEFT JOIN User u ON m.senderId = u.id
      WHERE m.conversationId = ?
      ORDER BY m.createdAt DESC
      LIMIT 1
    `, [idConversation]);

    const comptageNonLusResult = await queryOne(`
      SELECT COUNT(*) as count
      FROM Message
      WHERE conversationId = ?
        AND senderId != ?
        AND createdAt > ?
    `, [idConversation, requete.user.id, adhesion.lastReadAt || new Date(0)]);

    const comptageNonLus = comptageNonLusResult ? comptageNonLusResult.count : 0;

    let nomGroupe = null;
    if (adhesion.conv_groupId) {
      const groupe = await queryOne("SELECT name FROM `Group` WHERE id = ?", [adhesion.conv_groupId]);
      nomGroupe = groupe ? groupe.name : null;
    }

    conversations.push({
      id: idConversation,
      isGroup: !!adhesion.conv_groupId,
      groupName: nomGroupe,
      otherMembers: autreMembres,
      lastMessage: dernierMessage ? {
        id: dernierMessage.id,
        content: dernierMessage.content,
        createdAt: dernierMessage.createdAt,
        sender: {
          displayName: dernierMessage.sender_displayName
        }
      } : null,
      unreadCount: comptageNonLus,
      updatedAt: adhesion.conv_updatedAt
    });
  }

  reponse.render("messages/index", { user: requete.user, conversations });
});

//////////
// Démarre une conversation avec un autre utilisateur
// Cherche si conversation existe déjà
// Crée conversation et membres si n'existe pas
// Vérifie que l'autre utilisateur accepte les messages directs
// Retourne: JSON {conversationId} ou redirect /messages/:id
//////////
routesMessages.post("/start/:userId", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateurAutre = Number(requete.params.userId);
  const estAjax = requete.headers['x-requested-with'] === 'XMLHttpRequest';

  if (!Number.isFinite(idUtilisateurAutre) || idUtilisateurAutre === requete.user.id) {
    return estAjax ? reponse.json({ error: "Invalid user id" }) : reponse.redirect("/messages");
  }

  // Vérifier si je suis bloqué par cet utilisateur
  const amJeBloque = await queryOne(
    "SELECT * FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
    [idUtilisateurAutre, requete.user.id]
  );

  if (amJeBloque) {
    return reponse.json({
      error: "Vous ne pouvez pas envoyer de message à cet utilisateur",
      blocked: true
    });
  }

  // Vérifier si je bloque cet utilisateur
  const estBlocke = await queryOne(
    "SELECT * FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
    [requete.user.id, idUtilisateurAutre]
  );

  if (estBlocke) {
    return reponse.json({
      error: "Vous ne pouvez pas envoyer de message à cet utilisateur",
      blocked: true
    });
  }

  const confidentialiteUtilisateur = await queryOne(
    "SELECT canReceiveMessages FROM UserPrivacy WHERE userId = ?",
    [idUtilisateurAutre]
  );

  if (confidentialiteUtilisateur && !confidentialiteUtilisateur.canReceiveMessages) {
    return reponse.json({
      error: "Cet utilisateur n'accepte pas les messages directs",
      blocked: true
    });
  }

  const ids = [requete.user.id, idUtilisateurAutre].sort((a, b) => a - b);

  const conversationsExistantes = await query(`
    SELECT DISTINCT c.id
    FROM Conversation c
    WHERE c.groupId IS NULL
      AND EXISTS (SELECT 1 FROM ConversationMember WHERE conversationId = c.id AND userId = ?)
      AND EXISTS (SELECT 1 FROM ConversationMember WHERE conversationId = c.id AND userId = ?)
  `, [ids[0], ids[1]]);

  let idConversation = null;

  if (conversationsExistantes.length > 0) {
    const compteurMembres = await queryOne(
      "SELECT COUNT(*) as count FROM ConversationMember WHERE conversationId = ?",
      [conversationsExistantes[0].id]
    );
    if (compteurMembres && compteurMembres.count === 2) {
      idConversation = conversationsExistantes[0].id;
    }
  }

  if (!idConversation) {
    const resultat = await query("INSERT INTO Conversation (createdAt, updatedAt) VALUES (NOW(), NOW())");
    idConversation = resultat.insertId;

    await query(
      "INSERT INTO ConversationMember (conversationId, userId) VALUES (?, ?), (?, ?)",
      [idConversation, ids[0], idConversation, ids[1]]
    );
  }

  if (estAjax) {
    reponse.json({ conversationId: idConversation });
  } else {
    reponse.redirect(`/messages/${idConversation}`);
  }
});

//////////
// Affiche une conversation avec tous les messages
// Marque les messages comme lus
// Gère les conversations de groupe et directes
// Retourne: vue messages/conversation
//////////
routesMessages.get("/:id", exigerAuthentification, async (requete, reponse) => {
  const idConversation = Number(requete.params.id);
  if (!Number.isFinite(idConversation)) {
    return reponse.redirect("/messages");
  }

  const adhesion = await queryOne(
    "SELECT * FROM ConversationMember WHERE conversationId = ? AND userId = ?",
    [idConversation, requete.user.id]
  );

  if (!adhesion) {
    return reponse.redirect("/messages");
  }

  const conversation = await queryOne("SELECT * FROM Conversation WHERE id = ?", [idConversation]);

  const tousLesMembres = await query(`
    SELECT
      cm.userId,
      u.id as user_id,
      u.displayName as user_displayName,
      u.avatar as user_avatar
    FROM ConversationMember cm
    JOIN User u ON cm.userId = u.id
    WHERE cm.conversationId = ?
  `, [idConversation]);

  const autreMembres = tousLesMembres
    .filter(m => m.userId !== requete.user.id)
    .map(m => ({
      id: m.user_id,
      displayName: m.user_displayName,
      avatar: m.user_avatar
    }));

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
  `, [idConversation]);

  const donnesMessages = messages.map(m => ({
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

  await query(
    "UPDATE ConversationMember SET lastReadAt = NOW() WHERE conversationId = ? AND userId = ?",
    [idConversation, requete.user.id]
  );

  let nomGroupe = null;
  if (conversation.groupId) {
    const groupe = await queryOne("SELECT name FROM `Group` WHERE id = ?", [conversation.groupId]);
    nomGroupe = groupe ? groupe.name : null;
  }

  reponse.render("messages/conversation", {
    user: requete.user,
    conversation: {
      id: conversation.id,
      groupId: conversation.groupId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      members: tousLesMembres,
      messages: donnesMessages,
      group: conversation.groupId ? { id: conversation.groupId, name: nomGroupe } : null
    },
    otherMembers: autreMembres,
    isGroup: !!conversation.groupId,
    groupName: nomGroupe
  });
});

//////////
// Envoie un nouveau message dans une conversation
// Crée le message et met à jour updatedAt de la conversation
// Diffuse le message en temps réel aux autres membres
// Retourne: redirect /messages/:id
//////////
routesMessages.post("/:id/send", exigerAuthentification, async (requete, reponse) => {
  const idConversation = Number(requete.params.id);
  const contenu = requete.body.content?.trim();

  if (!Number.isFinite(idConversation) || !contenu) {
    return reponse.redirect(`/messages/${idConversation}`);
  }

  const adhesion = await queryOne(
    "SELECT * FROM ConversationMember WHERE conversationId = ? AND userId = ?",
    [idConversation, requete.user.id]
  );

  if (!adhesion) {
    return reponse.redirect("/messages");
  }

  // Vérifier si la conversation est un DM (pas de groupe) et si l'autre personne n'a pas bloqué
  const conversation = await queryOne(
    "SELECT * FROM Conversation WHERE id = ?",
    [idConversation]
  );

  if (!conversation.groupId) {
    // C'est un DM - vérifier le blocage
    const membres = await query(
      "SELECT userId FROM ConversationMember WHERE conversationId = ?",
      [idConversation]
    );

    const autreMembres = membres.filter(m => m.userId !== requete.user.id);

    for (const autreMembre of autreMembres) {
      const estBloque = await queryOne(
        "SELECT * FROM UserBlock WHERE (blockerId = ? AND blockedId = ?) OR (blockerId = ? AND blockedId = ?)",
        [requete.user.id, autreMembre.userId, autreMembre.userId, requete.user.id]
      );

      if (estBloque) {
        return reponse.redirect(`/messages/${idConversation}`);
      }
    }
  }

  const resultat = await query(
    "INSERT INTO Message (content, conversationId, senderId, createdAt) VALUES (?, ?, ?, NOW())",
    [contenu, idConversation, requete.user.id]
  );

  const idMessage = resultat.insertId;

  await query(
    "UPDATE Conversation SET updatedAt = NOW() WHERE id = ?",
    [idConversation]
  );

  const message = await queryOne(`
    SELECT
      m.*,
      u.id as sender_id,
      u.displayName as sender_displayName,
      u.avatar as sender_avatar
    FROM Message m
    LEFT JOIN User u ON m.senderId = u.id
    WHERE m.id = ?
  `, [idMessage]);

  const membres = await query(
    "SELECT userId FROM ConversationMember WHERE conversationId = ?",
    [idConversation]
  );

  membres.forEach(m => {
    if (m.userId !== requete.user.id) {
      diffuserMessage(m.userId, {
        type: "new_message",
        conversationId: idConversation,
        message: {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          sender: {
            id: message.sender_id,
            displayName: message.sender_displayName,
            avatar: message.sender_avatar
          }
        }
      });
    }
  });

  reponse.redirect(`/messages/${idConversation}`);
});
