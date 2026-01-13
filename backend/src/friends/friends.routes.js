import express from "express";
import { query, queryOne } from "../db.js";
import { exigerAuthentification } from "../auth/auth.middleware.js";

export const routesAmis = express.Router();

//////////
// Affiche les amis (followers, following, mutuals) d'un utilisateur
// Système basé sur Follow bidirectionnel
// Retourne: vue friends/index avec les listes d'amis
//////////
routesAmis.get("/", exigerAuthentification, async (requete, reponse) => {
  const onglet = requete.query.tab || "followers";
  const idUtilisateur = requete.query.userId ? Number(requete.query.userId) : requete.user.id;

  if (!Number.isFinite(idUtilisateur)) {
    return reponse.redirect("/friends");
  }

  let abonnes = [];
  let abonnements = [];
  let mutuels = [];
  let utilisateurConsulte = null;

  utilisateurConsulte = await queryOne(
    "SELECT id, displayName FROM User WHERE id = ?",
    [idUtilisateur]
  );

  if (!utilisateurConsulte) {
    return reponse.redirect("/friends");
  }

  if (onglet === "followers") {
    abonnes = await query(`
      SELECT u.id, u.displayName, u.avatar
      FROM Follow f
      JOIN User u ON f.followerId = u.id
      WHERE f.followedId = ?
      ORDER BY f.createdAt DESC
    `, [idUtilisateur]);
  } else if (onglet === "following") {
    abonnements = await query(`
      SELECT u.id, u.displayName, u.avatar
      FROM Follow f
      JOIN User u ON f.followedId = u.id
      WHERE f.followerId = ?
      ORDER BY f.createdAt DESC
    `, [idUtilisateur]);
  } else if (onglet === "mutuals") {
    mutuels = await query(`
      SELECT u.id, u.displayName, u.avatar
      FROM Follow f1
      JOIN Follow f2 ON f1.followerId = f2.followedId AND f1.followedId = f2.followerId
      JOIN User u ON f1.followedId = u.id
      WHERE f1.followerId = ?
      ORDER BY f1.createdAt DESC
    `, [idUtilisateur]);
  }

  reponse.render("friends/index", {
    user: requete.user,
    followers: abonnes,
    following: abonnements,
    mutuals: mutuels,
    tab: onglet,
    viewingUserId: idUtilisateur,
    viewingUserName: utilisateurConsulte.displayName
  });
});






