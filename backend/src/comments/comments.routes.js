import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
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
  const following = await query(
    "SELECT followedId FROM Follow WHERE followerId = ?",
    [req.user.id]
  );
  const followingIds = following.map(f => f.followedId);

  const friendships = await query(
    "SELECT userAId, userBId FROM Friendship WHERE userAId = ? OR userBId = ?",
    [req.user.id, req.user.id]
  );
  const friendIds = friendships.map(f => (f.userAId === req.user.id ? f.userBId : f.userAId));

  const post = await queryOne(
    "SELECT id, authorId, visibility, groupId FROM Post WHERE id = ?",
    [postId]
  );

  if (!post) return res.redirect("/posts/feed");

  // Privacy gate
  let allowed = false;
  if (post.authorId === req.user.id) allowed = true;
  else if (post.visibility === "PUBLIC") allowed = true;
  else if (post.visibility === "FOLLOWERS" && followingIds.includes(post.authorId)) allowed = true;
  else if (post.visibility === "FRIENDS" && friendIds.includes(post.authorId)) allowed = true;
  else allowed = false;

  if (!allowed) return res.status(403).send("Forbidden");

  const result = await query(
    "INSERT INTO Comment (content, postId, userId, createdAt) VALUES (?, ?, ?, NOW())",
    [content, postId, req.user.id]
  );

  await createNotification({
    type: "COMMENT",
    toUserId: post.authorId,
    fromUserId: req.user.id,
    postId,
    commentId: result.insertId
  });


  // Rediriger vers le groupe si c'est un post de groupe
  if (post.groupId) {
    return res.redirect(`/groups/${post.groupId}`);
  }
  return res.redirect("/posts/feed");
});

// POST /comments/:commentId/delete (auteur du commentaire OU auteur du post)
commentsRoutes.post("/comments/:commentId/delete", requireAuth, async (req, res) => {
  const commentId = Number(req.params.commentId);
  if (!Number.isFinite(commentId)) return res.redirect("/posts/feed");

  const comment = await queryOne(`
    SELECT
      c.id,
      c.userId,
      c.postId,
      p.authorId as post_authorId,
      p.groupId as post_groupId
    FROM Comment c
    JOIN Post p ON c.postId = p.id
    WHERE c.id = ?
  `, [commentId]);

  if (!comment) return res.redirect("/posts/feed");

  const isOwner = comment.userId === req.user.id;
  const isPostOwner = comment.post_authorId === req.user.id;

  if (!isOwner && !isPostOwner) return res.status(403).send("Forbidden");

  await query("DELETE FROM Comment WHERE id = ?", [commentId]);

  // Rediriger vers le groupe si c'est un post de groupe
  if (comment.post_groupId) {
    return res.redirect(`/groups/${comment.post_groupId}`);
  }
  return res.redirect("/posts/feed");
});
