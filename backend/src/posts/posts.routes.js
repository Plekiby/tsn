import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";
import { createNotification } from "../notifications/notifications.service.js";
import { getUnreadCount } from "../notifications/notifications.service.js";

export const postsRouter = express.Router();

/**
 * Feed SMART (privacy + scoring)
 * Debug: /posts/feed?debug=1
 */
postsRouter.get("/feed", requireAuth, async (req, res) => {
  const meId = req.user.id;
  const debug = req.query.debug === "1" || req.query.debug === "true";

  // 1) ids des auteurs que je follow
  const following = await prisma.follow.findMany({
    where: { followerId: meId },
    select: { followedId: true }
  });
  const followingIds = following.map(f => f.followedId);
  const followingSet = new Set(followingIds);

  // 2) ids de mes amis (friendship non orienté)
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: meId }, { userBId: meId }] },
    select: { userAId: true, userBId: true }
  });
  const friendIds = friendships.map(f => (f.userAId === meId ? f.userBId : f.userAId));
  const friendsSet = new Set(friendIds);

  // 3) mes intérêts
  const myInterests = await prisma.userInterest.findMany({
    where: { userId: meId },
    select: { interestId: true }
  });
  const myInterestSet = new Set(myInterests.map(x => x.interestId));

  // 4) where dynamique (privacy) pour éviter in:[]
  const whereOr = [{ authorId: meId }, { visibility: "PUBLIC" }];

  if (followingIds.length > 0) {
    whereOr.push({ visibility: "FOLLOWERS", authorId: { in: followingIds } });
  }
  if (friendIds.length > 0) {
    whereOr.push({ visibility: "FRIENDS", authorId: { in: friendIds } });
  }

  // 5) récupérer les posts visibles + compteurs + derniers comments (pour affichage)
  const rawPosts = await prisma.post.findMany({
    where: { OR: whereOr },
    orderBy: { createdAt: "desc" }, // pré-tri récent, puis on re-trie au score
    take: 80,
    include: {
      author: { select: { id: true, displayName: true } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { user: { select: { id: true, displayName: true } } }
      },
      _count: { select: { likes: true, comments: true } }
    }
  });

  // 6) intérêts des auteurs (1 seule requête, pas de N+1)
  const authorIds = [...new Set(rawPosts.map(p => p.authorId))];
  const authorInterests = authorIds.length
    ? await prisma.userInterest.findMany({
        where: { userId: { in: authorIds } },
        select: { userId: true, interestId: true }
      })
    : [];

  const interestsByUser = new Map(); // userId -> Set(interestId)
  for (const row of authorInterests) {
    if (!interestsByUser.has(row.userId)) interestsByUser.set(row.userId, new Set());
    interestsByUser.get(row.userId).add(row.interestId);
  }

  const now = Date.now();

  function commonInterestsCount(authorId) {
    const aSet = interestsByUser.get(authorId);
    if (!aSet || myInterestSet.size === 0) return 0;

    let count = 0;
    const [small, big] =
      myInterestSet.size <= aSet.size ? [myInterestSet, aSet] : [aSet, myInterestSet];

    for (const id of small) if (big.has(id)) count++;
    return count;
  }

  function computeScoreDetails(p) {
    // relation score
    let relationScore = 0;
    if (p.authorId === meId) relationScore = 100;
    else if (friendsSet.has(p.authorId)) relationScore = 60;
    else if (followingSet.has(p.authorId)) relationScore = 30;
    else relationScore = 10;

    // interest score
    const common = commonInterestsCount(p.authorId);
    const interestScore = common * 6;

    // freshness score
    const ageHours = (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 40 - ageHours);

    // engagement score (borné)
    const likesCount = p._count?.likes ?? p.likes?.length ?? 0;
    const commentsCount = p._count?.comments ?? 0;
    const engagementScore = Math.min(12, likesCount) + Math.min(12, commentsCount);

    const privatePenalty = p.visibility === "PRIVATE" && p.authorId !== meId ? -9999 : 0;

    const score =
      relationScore + interestScore + freshnessScore + engagementScore + privatePenalty;

    return {
      score,
      relationScore,
      commonInterests: common,
      interestScore,
      ageHours,
      freshnessScore,
      likesCount,
      commentsCount,
      engagementScore
    };
  }

  const posts = rawPosts
    .map(p => {
      const details = computeScoreDetails(p);
      return debug
        ? { ...p, score: details.score, debugScore: details }
        : { ...p, score: details.score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

    const unreadCount = await getUnreadCount(req.user.id);
res.render("feed/index", { user: req.user, posts, debug, unreadCount });
});

// Create post avec visibility
postsRouter.post("/", requireAuth, async (req, res) => {
  const content = (req.body?.content || "").trim();
  const visibility = (req.body?.visibility || "PUBLIC").toUpperCase();

  const allowed = new Set(["PUBLIC", "FOLLOWERS", "FRIENDS", "PRIVATE"]);
  const safeVisibility = allowed.has(visibility) ? visibility : "PUBLIC";

  if (!content) return res.redirect("/posts/feed");

  await prisma.post.create({
    data: {
      content,
      visibility: safeVisibility,
      authorId: req.user.id
    }
  });

  res.redirect("/posts/feed");
});

postsRouter.post("/:id/like", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId)) return res.redirect("/posts/feed");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true }
  });
  if (!post) return res.redirect("/posts/feed");

  try {
    await prisma.like.create({ data: { userId: req.user.id, postId } });

    await createNotification({
      type: "LIKE",
      toUserId: post.authorId,
      fromUserId: req.user.id,
      postId
    });

  } catch {
    await prisma.like
      .delete({ where: { userId_postId: { userId: req.user.id, postId } } })
      .catch(() => {});
  }

  res.redirect("/posts/feed");
});

