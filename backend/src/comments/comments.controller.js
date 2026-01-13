import { assertCanComment } from "./comments.service.js";

export async function createComment(req, res) {
  const prisma = req.prisma;
  const userId = req.user.id;

  const postId = Number(req.params.postId);
  const content = (req.body.content || "").trim();

  if (!content) return res.redirect("back");
  if (content.length > 1000) return res.redirect("back");

  await assertCanComment(prisma, userId, postId);

  await prisma.comment.create({
    data: { content, postId, userId },
  });

  return res.redirect("back");
}

export async function deleteComment(req, res) {
  const prisma = req.prisma;
  const userId = req.user.id;

  const commentId = Number(req.params.commentId);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      postId: true,
      post: { select: { authorId: true } },
    },
  });

  if (!comment) return res.status(404).send("Comment not found");

  // autoriser: auteur du commentaire OU auteur du post (modération)
  const isOwner = comment.userId === userId;
  const isPostOwner = comment.post.authorId === userId;

  if (!isOwner && !isPostOwner) return res.status(403).send("Forbidden");

  await prisma.comment.delete({ where: { id: commentId } });

  return res.redirect("back");
}
