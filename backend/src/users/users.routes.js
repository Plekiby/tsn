import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

export const usersRouter = express.Router();

/**
 * Page: recommandations FOAF (amis d'amis)
 */
usersRouter.get("/recommendations", requireAuth, async (req, res) => {
  // 1-hop: users I follow
  const myFollows = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followedId: true }
  });

  const already = new Set(myFollows.map(x => x.followedId));
  already.add(req.user.id);

  // 2-hop: follows of the users I follow
  const secondHop = await prisma.follow.findMany({
    where: { followerId: { in: myFollows.map(x => x.followedId) } },
    select: { followerId: true, followedId: true }
  });

  // score candidates by mutuals count
  const score = new Map(); // candidateId -> mutualCount
  for (const edge of secondHop) {
    const cand = edge.followedId;
    if (already.has(cand)) continue;
    score.set(cand, (score.get(cand) || 0) + 1);
  }

  const ranked = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  const users = ranked.length
    ? await prisma.user.findMany({
        where: { id: { in: ranked.map(([id]) => id) } },
        select: { id: true, displayName: true, email: true }
      })
    : [];

  const mutualMap = Object.fromEntries(ranked);

  const reco = users
    .map(u => ({ ...u, mutuals: mutualMap[u.id] || 0 }))
    .sort((a, b) => b.mutuals - a.mutuals);

  res.render("users/recommendations", { user: req.user, reco });
});

/**
 * Follow / Unfollow toggle
 */
usersRouter.post("/:id/follow", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isFinite(targetId) || targetId === req.user.id) {
    return res.redirect("/users/recommendations");
  }

  try {
    await prisma.follow.create({
      data: { followerId: req.user.id, followedId: targetId }
    });
  } catch {
    await prisma.follow
      .delete({
        where: {
          followerId_followedId: { followerId: req.user.id, followedId: targetId }
        }
      })
      .catch(() => {});
  }

  res.redirect("/users/recommendations");
});

/**
 * (Optionnel) liste simple des users pour tester le follow
 */
usersRouter.get("/all", requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    take: 50,
    orderBy: { id: "desc" },
    select: { id: true, displayName: true, email: true }
  });
  res.render("users/all", { user: req.user, users });
});
