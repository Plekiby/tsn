import express from "express";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { creerNotification } from "../notifications/notifications.service.js";

export const routesCommentaires = express.Router();

//////////
// Crée un commentaire sur une publication à partir du feed
// Valide la visibilité de la publication avant d'autoriser le commentaire
// Gère la privacy: PUBLIC, FOLLOWERS, FRIENDS
// Envoie une notification au propriétaire de la publication
// Retourne: redirect /posts/feed ou /groups/:id
//////////
routesCommentaires.post("/posts/:postId/comments", exigerAuthentification, async (requete, reponse) => {
  const idPublication = Number(requete.params.postId);
  const contenu = (requete.body?.content || "").trim();

  if (!Number.isFinite(idPublication)) return reponse.redirect("/posts/feed");
  if (!contenu) return reponse.redirect("/posts/feed");
  if (contenu.length > 1000) return reponse.redirect("/posts/feed");

  const abonnements = await query(
    "SELECT followedId FROM Follow WHERE followerId = ?",
    [requete.user.id]
  );
  const idsAbonnes = abonnements.map(f => f.followedId);

  const mutuels = idsAbonnes.length > 0
    ? await query(
        `SELECT followerId FROM Follow WHERE followedId = ? AND followerId IN (${idsAbonnes.map(() => '?').join(',')})`,
        [requete.user.id, ...idsAbonnes]
      )
    : [];
  const idsAmis = mutuels.map(m => m.followerId);

  const publication = await queryOne(
    "SELECT id, authorId, visibility, groupId FROM Post WHERE id = ?",
    [idPublication]
  );

  if (!publication) return reponse.redirect("/posts/feed");

  let autorise = false;
  if (publication.authorId === requete.user.id) autorise = true;
  else if (publication.visibility === "PUBLIC") autorise = true;
  else if (publication.visibility === "FOLLOWERS" && idsAbonnes.includes(publication.authorId)) autorise = true;
  else if (publication.visibility === "FRIENDS" && idsAmis.includes(publication.authorId)) autorise = true;

  if (!autorise) return reponse.status(403).send("Forbidden");

  const resultat = await query(
    "INSERT INTO Comment (content, postId, userId, createdAt) VALUES (?, ?, ?, NOW())",
    [contenu, idPublication, requete.user.id]
  );

  await creerNotification({
    type: "COMMENT",
    toUserId: publication.authorId,
    fromUserId: requete.user.id,
    postId: idPublication,
    commentId: resultat.insertId
  });

  if (publication.groupId) {
    return reponse.redirect(`/groups/${publication.groupId}`);
  }
  return reponse.redirect("/posts/feed");
});

//////////
// Supprime un commentaire
// Autorise: auteur du commentaire OU auteur de la publication (modération)
// Valide l'ID du commentaire
// Redirige vers feed ou groupe selon contexte
// Retourne: redirect /posts/feed ou /groups/:id
//////////
routesCommentaires.post("/comments/:commentId/delete", exigerAuthentification, async (requete, reponse) => {
  const idCommentaire = Number(requete.params.commentId);
  if (!Number.isFinite(idCommentaire)) return reponse.redirect("/posts/feed");

  const commentaire = await queryOne(`
    SELECT
      c.id,
      c.userId,
      c.postId,
      p.authorId as post_authorId,
      p.groupId as post_groupId
    FROM Comment c
    JOIN Post p ON c.postId = p.id
    WHERE c.id = ?
  `, [idCommentaire]);

  if (!commentaire) return reponse.redirect("/posts/feed");

  const estProprietaire = commentaire.userId === requete.user.id;
  const estProprietairePublication = commentaire.post_authorId === requete.user.id;

  if (!estProprietaire && !estProprietairePublication) return reponse.status(403).send("Forbidden");

  await query("DELETE FROM Comment WHERE id = ?", [idCommentaire]);

  if (commentaire.post_groupId) {
    return reponse.redirect(`/groups/${commentaire.post_groupId}`);
  }
  return reponse.redirect("/posts/feed");
});






