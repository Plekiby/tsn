import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";

export const postsRouter = express.Router();

// Page feed (EJS)
postsRouter.get("/feed", requireAuth, async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followedId: true }
  });

  const ids = [req.user.id, ...following.map(f => f.followedId)];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: ids } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, displayName: true } },
      likes: { select: { userId: true } }
    }
  });

  res.render("feed/index", { user: req.user, posts });
});

// Create post
postsRouter.post("/", requireAuth, async (req, res) => {
  const content = (req.body?.content || "").trim();
  if (!content) return res.redirect("/posts/feed");

  await prisma.post.create({
    data: { content, authorId: req.user.id }
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
