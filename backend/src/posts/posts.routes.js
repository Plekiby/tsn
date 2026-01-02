import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";

export const postsRouter = express.Router();

// Feed avec privacy (robuste même si lists vides)
postsRouter.get("/feed", requireAuth, async (req, res) => {
  // ids des auteurs que je follow
  const following = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followedId: true }
  });
  const followingIds = following.map(f => f.followedId);

  // ids de mes amis (friendship non orienté)
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] },
    select: { userAId: true, userBId: true }
  });
  const friendIds = friendships.map(f => (f.userAId === req.user.id ? f.userBId : f.userAId));

  // where dynamique pour éviter les `in: []`
  const whereOr = [
    { authorId: req.user.id },
    { visibility: "PUBLIC" }
  ];

  if (followingIds.length > 0) {
    whereOr.push({ visibility: "FOLLOWERS", authorId: { in: followingIds } });
  }
  if (friendIds.length > 0) {
    whereOr.push({ visibility: "FRIENDS", authorId: { in: friendIds } });
  }

  const posts = await prisma.post.findMany({
    where: { OR: whereOr },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, displayName: true } },
      likes: { select: { userId: true } }
    }
  });

  res.render("feed/index", { user: req.user, posts });
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

// Like/unlike
postsRouter.post("/:id/like", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isFinite(postId)) return res.redirect("/posts/feed");

  try {
    await prisma.like.create({ data: { userId: req.user.id, postId } });
  } catch {
    await prisma.like
      .delete({ where: { userId_postId: { userId: req.user.id, postId } } })
      .catch(() => {});
  }

  res.redirect("/posts/feed");
});
