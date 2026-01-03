import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";
import { createNotification } from "../notifications/notifications.service.js";

export const commentsRoutes = express.Router();

// POST /posts/:postId/comments (création depuis feed)
commentsRoutes.post("/posts/:postId/comments", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  const content = (req.body?.content || "").trim();

  if (!Number.isFinite(postId)) return res.redirect("/posts/feed");
  if (!content) return res.redirect("/posts/feed");
  if (content.length > 1000) return res.redirect("/posts/feed");

  // Même logique privacy que /posts/feed
  const following = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followedId: true }
  });
  const followingIds = following.map(f => f.followedId);

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] },
    select: { userAId: true, userBId: true }
  });
  const friendIds = friendships.map(f => (f.userAId === req.user.id ? f.userBId : f.userAId));

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, visibility: true }
  });

  if (!post) return res.redirect("/posts/feed");

  // Privacy gate
  let allowed = false;
  if (post.authorId === req.user.id) allowed = true;
  else if (post.visibility === "PUBLIC") allowed = true;
  else if (post.visibility === "FOLLOWERS" && followingIds.includes(post.authorId)) allowed = true;
  else if (post.visibility === "FRIENDS" && friendIds.includes(post.authorId)) allowed = true;
  else allowed = false;

  if (!allowed) return res.status(403).send("Forbidden");

  const created = await prisma.comment.create({
  data: {
        content,
        postId,
        userId: req.user.id
    }
    });

    await createNotification({
    type: "COMMENT",
    toUserId: post.authorId,
    fromUserId: req.user.id,
    postId,
    commentId: created.id
    });


  return res.redirect("/posts/feed");
});

// POST /comments/:commentId/delete (auteur du commentaire OU auteur du post)
commentsRoutes.post("/comments/:commentId/delete", requireAuth, async (req, res) => {
  const commentId = Number(req.params.commentId);
  if (!Number.isFinite(commentId)) return res.redirect("/posts/feed");

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      postId: true,
      post: { select: { authorId: true } }
    }
  });

  if (!comment) return res.redirect("/posts/feed");

  const isOwner = comment.userId === req.user.id;
  const isPostOwner = comment.post.authorId === req.user.id;

  if (!isOwner && !isPostOwner) return res.status(403).send("Forbidden");

  await prisma.comment.delete({ where: { id: commentId } });
  return res.redirect("/posts/feed");
});
