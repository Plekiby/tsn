import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
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
  const following = await query(
    "SELECT followedId FROM Follow WHERE followerId = ?",
    [meId]
  );
  const followingIds = following.map(f => f.followedId);
  const followingSet = new Set(followingIds);

  // 2) ids de mes amis (friendship non orienté)
  const friendships = await query(
    "SELECT userAId, userBId FROM Friendship WHERE userAId = ? OR userBId = ?",
    [meId, meId]
  );
  const friendIds = friendships.map(f => (f.userAId === meId ? f.userBId : f.userAId));
  const friendsSet = new Set(friendIds);

  // 3) mes intérêts
  const myInterests = await query(
    "SELECT interestId FROM UserInterest WHERE userId = ?",
    [meId]
  );
  const myInterestSet = new Set(myInterests.map(x => x.interestId));

  // 3.5) mes memberships de groupes (pour posts privés de groupes)
  const memberships = await query(
    "SELECT groupId FROM GroupMember WHERE userId = ?",
    [req.user.id]
  );
  const groupIds = memberships.map(m => m.groupId);

  // 4) Construction de la clause WHERE SQL
  let whereClauses = [];
  let whereParams = [];

  // Mes propres posts
  whereClauses.push("p.authorId = ?");
  whereParams.push(meId);

  // Posts publics
  whereClauses.push("p.visibility = 'PUBLIC'");

  // Posts FOLLOWERS si je follow des gens
  if (followingIds.length > 0) {
    whereClauses.push(`(p.visibility = 'FOLLOWERS' AND p.authorId IN (${followingIds.map(() => '?').join(',')}))`);
    whereParams.push(...followingIds);
  }

  // Posts FRIENDS si j'ai des amis
  if (friendIds.length > 0) {
    whereClauses.push(`(p.visibility = 'FRIENDS' AND p.authorId IN (${friendIds.map(() => '?').join(',')}))`);
    whereParams.push(...friendIds);
  }

  // Posts de groupes dont je suis membre
  if (groupIds.length > 0) {
    whereClauses.push(`p.groupId IN (${groupIds.map(() => '?').join(',')})`);
    whereParams.push(...groupIds);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE (${whereClauses.join(' OR ')})` : '';

  // 5) récupérer les posts visibles
  const postsData = await query(`
    SELECT
      p.*,
      u.id as author_id,
      u.displayName as author_displayName,
      g.id as group_id,
      g.name as group_name,
      (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id) as likes_count,
      (SELECT COUNT(*) FROM Comment WHERE postId = p.id) as comments_count
    FROM Post p
    LEFT JOIN User u ON p.authorId = u.id
    LEFT JOIN \`Group\` g ON p.groupId = g.id
    ${whereSQL}
    ORDER BY p.createdAt DESC
    LIMIT 80
  `, whereParams);

  // Récupérer les likes de chaque post
  const postIds = postsData.map(p => p.id);
  const likes = postIds.length > 0 ? await query(`
    SELECT postId, userId FROM \`Like\` WHERE postId IN (${postIds.map(() => '?').join(',')})
  `, postIds) : [];

  // Récupérer les 3 derniers commentaires de chaque post
  const comments = postIds.length > 0 ? await query(`
    SELECT
      c.*,
      u.id as user_id,
      u.displayName as user_displayName
    FROM Comment c
    JOIN User u ON c.userId = u.id
    WHERE c.postId IN (${postIds.map(() => '?').join(',')})
    ORDER BY c.createdAt DESC
  `, postIds) : [];

  // Regrouper les données
  const rawPosts = postsData.map(p => ({
    id: p.id,
    content: p.content,
    visibility: p.visibility,
    authorId: p.authorId,
    groupId: p.group_id,
    createdAt: p.createdAt,
    author: {
      id: p.author_id,
      displayName: p.author_displayName
    },
    group: p.group_id ? {
      id: p.group_id,
      name: p.group_name
    } : null,
    likes: likes.filter(l => l.postId === p.id).map(l => ({ userId: l.userId })),
    comments: comments
      .filter(c => c.postId === p.id)
      .slice(0, 3)
      .map(c => ({
        id: c.id,
        content: c.content,
        postId: c.postId,
        userId: c.userId,
        createdAt: c.createdAt,
        user: {
          id: c.user_id,
          displayName: c.user_displayName
        }
      })),
    _count: {
      likes: p.likes_count,
      comments: p.comments_count
    }
  }));

  // 6) intérêts des auteurs (1 seule requête, pas de N+1)
  const authorIds = [...new Set(rawPosts.map(p => p.authorId))];
  const authorInterests = authorIds.length > 0
    ? await query(`
        SELECT userId, interestId FROM UserInterest WHERE userId IN (${authorIds.map(() => '?').join(',')})
      `, authorIds)
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
    // group bonus (si post appartient à un groupe dont je suis membre)
    const groupBonus = p.groupId && groupIds.includes(p.groupId) ? 20 : 0;
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

    const score = relationScore + interestScore + freshnessScore + engagementScore + groupBonus +privatePenalty;

    return {
      score,
      relationScore,
      commonInterests: common,
      interestScore,
      ageHours,
      freshnessScore,
      likesCount,
      commentsCount,
      engagementScore,
      groupBonus
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

  const unreadCountResult = await queryOne(
    "SELECT COUNT(*) as count FROM Notification WHERE toUserId = ? AND readAt IS NULL",
    [req.user.id]
  );
  const unreadCount = unreadCountResult ? unreadCountResult.count : 0;
  res.render("feed/index", { user: req.user, posts, debug, unreadCount });
});

// Create post avec visibility
postsRouter.post("/", requireAuth, async (req, res) => {
  const content = (req.body?.content || "").trim();
  const visibility = (req.body?.visibility || "PUBLIC").toUpperCase();

  const allowed = new Set(["PUBLIC", "FOLLOWERS", "FRIENDS", "PRIVATE"]);
  const safeVisibility = allowed.has(visibility) ? visibility : "PUBLIC";

  if (!content) return res.redirect("/posts/feed");

  await query(
    "INSERT INTO Post (content, visibility, authorId, createdAt) VALUES (?, ?, ?, NOW())",
    [content, safeVisibility, req.user.id]
  );

  res.redirect("/posts/feed");
});

postsRouter.post("/:id/like", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId)) return res.redirect("/posts/feed");

  const post = await queryOne(
    "SELECT id, authorId, groupId FROM Post WHERE id = ?",
    [postId]
  );
  if (!post) return res.redirect("/posts/feed");

  try {
    await query(
      "INSERT INTO `Like` (userId, postId) VALUES (?, ?)",
      [req.user.id, postId]
    );

    await createNotification({
      type: "LIKE",
      toUserId: post.authorId,
      fromUserId: req.user.id,
      postId
    });

  } catch {
    await query(
      "DELETE FROM `Like` WHERE userId = ? AND postId = ?",
      [req.user.id, postId]
    ).catch(() => {});
  }

  // Rediriger vers le groupe si c'est un post de groupe, sinon vers le feed
  if (post.groupId) {
    res.redirect(`/groups/${post.groupId}`);
  } else {
    res.redirect("/posts/feed");
  }
});

