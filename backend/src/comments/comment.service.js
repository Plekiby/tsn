import { peutVoirPublication } from "../services/privacy.js";

//////////
// Vérifie si un utilisateur peut commenter un post
// Charge le post et vérifie les permissions
// Retourne: Promise<Object> le post s'il peut commenter
//////////
export async function verifierPeuxCommenter(prisma, idUtilisateur, idPublication) {
  const publication = await prisma.post.findUnique({
    where: { id: idPublication },
    select: { id: true, authorId: true, visibility: true },
  });
  if (!publication) {
    const err = new Error("POST_NOT_FOUND");
    err.status = 404;
    throw err;
  }

  const autorise = await peutVoirPublication(prisma, idUtilisateur, publication);
  if (!autorise) {
    const err = new Error("FORBIDDEN");
    err.status = 403;
    throw err;
  }

  return publication;
}






