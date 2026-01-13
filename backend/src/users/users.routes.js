import express from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { createNotification } from "../notifications/notifications.service.js";

export const usersRouter = express.Router();

/**
 * Page: recommandations FOAF (amis d'amis)
 */
usersRouter.get("/recommendations", requireAuth, async (req, res) => {
  // 1) Mes follows (1-hop)
  const myFollows = await query(
    "SELECT followedId FROM Follow WHERE followerId = ?",
    [req.user.id]
  );

  const already = new Set(myFollows.map(x => x.followedId));
  already.add(req.user.id);

  const hop1 = myFollows.map(x => x.followedId);

  // 2) 2-hop: follows des gens que je follow
  const secondHop = hop1.length > 0
    ? await query(
        `SELECT followerId, followedId FROM Follow WHERE followerId IN (${hop1.map(() => '?').join(',')})`,
        hop1
      )
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
  const myInterestsRows = await query(
    "SELECT ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId = ?",
    [req.user.id]
  );

  const myInterestIds = new Set(myInterestsRows.map(x => x.interestId));
  const myInterestNames = new Map(myInterestsRows.map(x => [x.interestId, x.name]));

  // 5) Intérêts des candidats (en batch)
  const candInterestRows = candidates.length > 0
    ? await query(
        `SELECT ui.userId, ui.interestId, i.name FROM UserInterest ui JOIN Interest i ON ui.interestId = i.id WHERE ui.userId IN (${candidates.map(() => '?').join(',')})`,
        candidates
      )
    : [];

  const candInterests = new Map(); // userId -> Set(interestId)
  const candCommonNames = new Map(); // userId -> string[] communs (noms)

  for (const row of candInterestRows) {
    if (!candInterests.has(row.userId)) candInterests.set(row.userId, new Set());
    candInterests.get(row.userId).add(row.interestId);

    if (myInterestIds.has(row.interestId)) {
      if (!candCommonNames.has(row.userId)) candCommonNames.set(row.userId, []);
      candCommonNames.get(row.userId).push(row.name);
    }
  }

  // 6) Récupère displayName + mutual displayName (pour explication)
  const users = candidates.length > 0
    ? await query(
        `SELECT id, displayName, email FROM User WHERE id IN (${candidates.map(() => '?').join(',')})`,
        candidates
      )
    : [];
  const userById = new Map(users.map(u => [u.id, u]));

  const mutualIdsAll = new Set();
  for (const s of mutualWho.values()) for (const id of s) mutualIdsAll.add(id);

  const mutualUsers = mutualIdsAll.size > 0
    ? await query(
        `SELECT id, displayName FROM User WHERE id IN (${[...mutualIdsAll].map(() => '?').join(',')})`,
        [...mutualIdsAll]
      )
    : [];

  const mutualNameById = new Map(mutualUsers.map(u => [u.id, u.displayName]));

  // 7) Score final = mutuals + commonInterests (plus simple et équitable)
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
      const commonCount = commonInterests.length;

      const mutualListIds = mutualWho.has(candId) ? [...mutualWho.get(candId)] : [];
      const mutualNames = mutualListIds.map(id => mutualNameById.get(id) || `#${id}`);

      const score = mutuals * 10 + commonCount;

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
  const back = req.get("referer") || "/users/recommendations";

  if (!Number.isFinite(targetId) || targetId === req.user.id) {
    return res.redirect(back);
  }

  try {
    await query(
      "INSERT INTO Follow (followerId, followedId) VALUES (?, ?)",
      [req.user.id, targetId]
    );
    await createNotification({
      type: "FOLLOW",
      toUserId: targetId,
      fromUserId: req.user.id
    });
  } catch {
    await query(
      "DELETE FROM Follow WHERE followerId = ? AND followedId = ?",
      [req.user.id, targetId]
    ).catch(() => {});
  }

  res.redirect(back);
});

/**
 * (Optionnel) liste simple des users pour tester le follow
 */
usersRouter.get("/all", requireAuth, async (req, res) => {
  const users = await query(
    "SELECT id, displayName, email FROM User ORDER BY id DESC LIMIT 50"
  );
  res.render("users/all", { user: req.user, users });
});
