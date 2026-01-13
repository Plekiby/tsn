import { prisma } from "../prisma.js";

export async function attachUnreadCount(req, res, next) {
  try {
    // si pas connecté -> pas de badge
    if (!req.user?.id) {
      res.locals.unreadCount = 0;
      return next();
    }

    const unreadCount = await prisma.notification.count({
      where: { toUserId: req.user.id, readAt: null }
    });

    // accessible dans toutes les vues EJS sans passer en render()
    res.locals.unreadCount = unreadCount;
    return next();
  } catch (e) {
    res.locals.unreadCount = 0;
    return next();
  }
}
