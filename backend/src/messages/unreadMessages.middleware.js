import { query } from "../db.js";
import jwt from "jsonwebtoken";

//////////
// Attache le nombre de messages non lus à reponse.locals
// Compte les conversations avec messages non lus
// Retourne: void (modifie reponse.locals.unreadMessages)
//////////
export async function ajouterCompteurMessagesNonLus(requete, reponse, next) {
  const token = requete.cookies?.token;
  if (!token) {
    reponse.locals.unreadMessages = 0;
    return next();
  }

  let idUtilisateur;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    idUtilisateur = Number(payload.sub);
  } catch {
    reponse.locals.unreadMessages = 0;
    return next();
  }

  try {
    const membres = await query(`
      SELECT
        cm.conversationId,
        cm.lastReadAt,
        (SELECT createdAt FROM Message WHERE conversationId = cm.conversationId AND senderId != ? ORDER BY createdAt DESC LIMIT 1) as lastMsgCreatedAt
      FROM ConversationMember cm
      WHERE cm.userId = ?
    `, [idUtilisateur, idUtilisateur]);

    let total = 0;
    for (const member of membres) {
      if (member.lastMsgCreatedAt && (!member.lastReadAt || new Date(member.lastMsgCreatedAt) > new Date(member.lastReadAt))) {
        total++;
      }
    }

    reponse.locals.unreadMessages = total;
  } catch (err) {
    reponse.locals.unreadMessages = 0;
  }

  next();
}






