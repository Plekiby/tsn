import { query } from "../db.js";

export async function attachUnreadMessages(req, res, next) {
  if (!req.user?.id) {
    res.locals.unreadMessages = 0;
    return next();
  }

  try {
    const members = await query(`
      SELECT
        cm.conversationId,
        cm.lastReadAt,
        (SELECT createdAt FROM Message WHERE conversationId = cm.conversationId AND senderId != ? ORDER BY createdAt DESC LIMIT 1) as lastMsgCreatedAt
      FROM ConversationMember cm
      WHERE cm.userId = ?
    `, [req.user.id, req.user.id]);

    let total = 0;
    for (const member of members) {
      if (member.lastMsgCreatedAt && (!member.lastReadAt || new Date(member.lastMsgCreatedAt) > new Date(member.lastReadAt))) {
        total++;
      }
    }

    res.locals.unreadMessages = total;
  } catch (err) {
    res.locals.unreadMessages = 0;
  }

  next();
}
