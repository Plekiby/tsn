import { queryOne } from "../db.js";
import jwt from "jsonwebtoken";

//////////
// Attache le nombre de notifications non lues à reponse.locals
// Extrait l'userId du JWT et compte les notifications non lues
// Retourne: void (modifie reponse.locals.unreadCount)
//////////
export async function ajouterCompteurNotificationsNonLues(requete, reponse, next) {
  try {
    const token = requete.cookies?.token;
    if (!token) {
      reponse.locals.unreadCount = 0;
      return next();
    }

    let idUtilisateur;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      idUtilisateur = Number(payload.sub);
    } catch {
      reponse.locals.unreadCount = 0;
      return next();
    }

    const resultat = await queryOne(
      "SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL",
      [idUtilisateur]
    );

    reponse.locals.unreadCount = resultat ? resultat.count : 0;
    return next();
  } catch (e) {
    reponse.locals.unreadCount = 0;
    return next();
  }
}






