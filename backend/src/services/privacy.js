//////////
// Vérifie si un utilisateur peut voir un post selon sa visibilité
// Gère PUBLIC, PRIVATE, FOLLOWERS, FRIENDS
// Retourne: Promise<boolean>
//////////
export async function peutVoirPublication(prisma, idUtilisateur, publication) {
  if (!publication) return false;
  if (publication.userId === idUtilisateur) return true;

  switch (publication.privacy) {
    case "PUBLIC":
      return true;

    case "PRIVATE":
      return false;

    case "FOLLOWERS": {
      const suivi = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: idUtilisateur,
            followingId: publication.userId,
          },
        },
        select: { followerId: true },
      });
      return !!suivi;
    }

    case "FRIENDS": {
      const ami = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: idUtilisateur, userBId: publication.userId },
            { userAId: publication.userId, userBId: idUtilisateur },
          ],
        },
        select: { id: true },
      });
      return !!ami;
    }

    default:
      return false;
  }
}






