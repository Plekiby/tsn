// src/services/privacy.js
export async function canViewPost(prisma, viewerId, post) {
  // post doit contenir au minimum: userId, privacy
  if (!post) return false;
  if (post.userId === viewerId) return true;

  switch (post.privacy) {
    case "PUBLIC":
      return true;

    case "PRIVATE":
      return false;

    case "FOLLOWERS": {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: post.userId,
          },
        },
        select: { followerId: true },
      });
      return !!follow;
    }

    case "FRIENDS": {
      // adapte à TON schéma exact :
      // si tu as une table Friendship (userAId, userBId) unique => check OR
      // sinon si tu as Friendship + FriendRequest, check Friendship.
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: viewerId, userBId: post.userId },
            { userAId: post.userId, userBId: viewerId },
          ],
        },
        select: { id: true },
      });
      return !!friendship;
    }

    default:
      return false;
  }
}
