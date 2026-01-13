import { verifierPeuxCommenter } from "./comments.service.js";

//////////
// Crée un nouveau commentaire sur une publication
// Valide le contenu (non-vide, max 1000 caractères)
// Vérifie les droits de commenter via verifierPeuxCommenter()
// Injecte userId, postId et contenu en base de données
// Retourne: redirect back (vers la page d'origine)
//////////
export async function creerCommentaire(requete, reponse) {
  const idUtilisateur = requete.user.id;

  const idPublication = Number(requete.params.postId);
  const contenu = (requete.body.content || "").trim();

  if (!contenu) return reponse.redirect("back");
  if (contenu.length > 1000) return reponse.redirect("back");

  await verifierPeuxCommenter(requete.prisma, idUtilisateur, idPublication);

  await requete.prisma.comment.create({
    data: { content: contenu, postId: idPublication, userId: idUtilisateur },
  });

  return reponse.redirect("back");
}

//////////
// Supprime un commentaire existant
// Autorise: auteur du commentaire OU auteur de la publication (modération)
// Valide l'ID du commentaire
// Retourne: redirect back
//////////
export async function supprimerCommentaire(requete, reponse) {
  const idUtilisateur = requete.user.id;
  const idCommentaire = Number(requete.params.commentId);

  const commentaire = await requete.prisma.comment.findUnique({
    where: { id: idCommentaire },
    select: {
      id: true,
      userId: true,
      postId: true,
      post: { select: { authorId: true } },
    },
  });

  if (!commentaire) return reponse.status(404).send("Comment not found");

  const estProprietaire = commentaire.userId === idUtilisateur;
  const estProprietairePublication = commentaire.post.authorId === idUtilisateur;

  if (!estProprietaire && !estProprietairePublication) return reponse.status(403).send("Forbidden");

  await requete.prisma.comment.delete({ where: { id: idCommentaire } });

  return reponse.redirect("back");
}






