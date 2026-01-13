import { canViewPost } from "../services/privacy.js";

export async function assertCanComment(prisma, userId, postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, visibility: true },
  });
  if (!post) {
    const err = new Error("POST_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  const allowed = await canViewPost(prisma, userId, post);
  if (!allowed) {
    const err = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }

  return post;
}
