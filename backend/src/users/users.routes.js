import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

export const usersRouter = express.Router();

/**
 * Page: recommandations FOAF (amis d'amis)
 */
usersRouter.get("/recommendations", requireAuth, async (req, res) => {
  // 1) Mes follows (1-hop)
  const myFollows = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followedId: true }
  });

  const already = new Set(myFollows.map(x => x.followedId));
  already.add(req.user.id);

  const hop1 = myFollows.map(x => x.followedId);

  // 2) 2-hop: follows des gens que je follow
  const secondHop = hop1.length
    ? await prisma.follow.findMany({
        where: { followerId: { in: hop1 } },
        select: { followerId: true, followedId: true }
      })
    : [];

  // 3) Mutuals: score topologique (combien de "mutuals" pointent vers cand)
  // On garde aussi la liste des mutuals (pour l'explication)
  const mutualCount = new Map(); // cand -> count
  const mutualWho = new Map();   // cand -> Set(mutualId)

  for (const edge of secondHop) {
    const mutual = edge.followerId; // la personne en commun (hop1)
    const cand = edge.followedId;   // candidat (hop2)

    if (already.has(cand)) continue;

    mutualCount.set(cand, (mutualCount.get(cand) || 0) + 1);

    if (!mutualWho.has(cand)) mutualWho.set(cand, new Set());
    mutualWho.get(cand).add(mutual);
  }

  const candidates = [...mutualCount.keys()];
  if (candidates.length === 0) {
    return res.render("users/recommendations", { user: req.user, reco: [] });
  }

  // 4) Intérêts du user courant
  const myInterestsRows = await prisma.userInterest.findMany({
    where: { userId: req.user.id },
    select: { interestId: true, interest: { select: { name: true } } }
  });

  const myInterestIds = new Set(myInterestsRows.map(x => x.interestId));
  const myInterestNames = new Map(myInterestsRows.map(x => [x.interestId, x.interest.name]));

  // 5) Intérêts des candidats (en batch)
  const candInterestRows = await prisma.userInterest.findMany({
    where: { userId: { in: candidates } },
    select: { userId: true, interestId: true, interest: { select: { name: true } } }
  });

  const candInterests = new Map(); // userId -> Set(interestId)
  const candCommonNames = new Map(); // userId -> string[] communs (noms)

  for (const row of candInterestRows) {
    if (!candInterests.has(row.userId)) candInterests.set(row.userId, new Set());
    candInterests.get(row.userId).add(row.interestId);

    if (myInterestIds.has(row.interestId)) {
      if (!candCommonNames.has(row.userId)) candCommonNames.set(row.userId, []);
      candCommonNames.get(row.userId).push(row.interest.name);
    }
  }

  // 6) Récupère displayName + mutual displayName (pour explication)
  const users = await prisma.user.findMany({
    where: { id: { in: candidates } },
    select: { id: true, displayName: true, email: true }
  });
  const userById = new Map(users.map(u => [u.id, u]));

  const mutualIdsAll = new Set();
  for (const s of mutualWho.values()) for (const id of s) mutualIdsAll.add(id);

  const mutualUsers = mutualIdsAll.size
    ? await prisma.user.findMany({
        where: { id: { in: [...mutualIdsAll] } },
        select: { id: true, displayName: true }
      })
    : [];

  const mutualNameById = new Map(mutualUsers.map(u => [u.id, u.displayName]));

  // 7) Score final = mutuals + 2 * Jaccard (simple, stable)
  function jaccard(aSet, bSet) {
    const a = aSet || new Set();
    const b = bSet || new Set();
    if (a.size === 0 && b.size === 0) return 0;

    let inter = 0;
    for (const x of a) if (b.has(x)) inter++;

    const union = a.size + b.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  const reco = candidates
    .map((candId) => {
      const cand = userById.get(candId);
      const mutuals = mutualCount.get(candId) || 0;

      const candSet = candInterests.get(candId) || new Set();
      const jac = jaccard(myInterestIds, candSet);

      const commonInterests = candCommonNames.get(candId) || [];

      const mutualListIds = mutualWho.has(candId) ? [...mutualWho.get(candId)] : [];
      const mutualNames = mutualListIds.map(id => mutualNameById.get(id) || `#${id}`);

      const score = mutuals + 1 * jac;

      return {
        id: candId,
        displayName: cand?.displayName || `User#${candId}`,
        email: cand?.email || "",
        score: Number(score.toFixed(3)),
        mutuals,
        mutualNames,
        jaccard: Number(jac.toFixed(3)),
        commonInterests
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

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
