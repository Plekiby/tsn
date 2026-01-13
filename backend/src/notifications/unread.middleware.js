import { queryOne } from "../db.js";

export async function attachUnreadCount(req, res, next) {
  try {
    // si pas connecté -> pas de badge
    if (!req.user?.id) {
      res.locals.unreadCount = 0;
      return next();
    }

    const result = await queryOne(
      "SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL",
      [req.user.id]
    );

    // accessible dans toutes les vues EJS sans passer en render()
    res.locals.unreadCount = result ? result.count : 0;
    return next();
  } catch (e) {
    res.locals.unreadCount = 0;
    return next();
  }
}
