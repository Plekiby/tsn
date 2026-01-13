import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query, queryOne } from "../db.js";

export const routesAuth = express.Router();

//////////
// Définit le cookie JWT dans la réponse
// Configure httpOnly, sameSite et secure pour la sécurité
// Paramètres: reponse (objet), token (JWT string)
//////////
function definirCookieAuthentification(reponse, jeton) {
  reponse.cookie("token", jeton, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "prod"
  });
}

//////////
// Page de connexion
// Affiche le formulaire de login
// Retourne: view auth/login
//////////
routesAuth.get("/login", (requete, reponse) => reponse.render("auth/login"));

//////////
// Page d'inscription
// Affiche le formulaire d'enregistrement
// Retourne: view auth/register
//////////
routesAuth.get("/register", (requete, reponse) => reponse.render("auth/register"));

//////////
// Crée un nouvel utilisateur et le connecte automatiquement
// Hash le mot de passe avec bcrypt (12 rounds)
// Crée un JWT de 7 jours d'expiration
// Retourne: redirect vers /feed
//////////
routesAuth.post("/register", async (requete, reponse) => {
  const { email, password, displayName } = requete.body || {};
  if (!email || !password || !displayName) return reponse.status(400).send("missing fields");

  const existe = await queryOne("SELECT id FROM User WHERE email = ?", [email]);
  if (existe) return reponse.status(409).send("email already used");

  const hashMotDePasse = await bcrypt.hash(password, 12);
  const resultat = await query(
    "INSERT INTO User (email, passwordHash, displayName, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
    [email, hashMotDePasse, displayName]
  );

  const idUtilisateur = resultat.insertId;
  const jeton = jwt.sign({ sub: idUtilisateur, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  definirCookieAuthentification(reponse, jeton);
  reponse.redirect("/feed");
});

//////////
// Connecte un utilisateur existant
// Valide email + password contre la base de données
// Hash du mot de passe avec bcrypt
// Crée un JWT et le stocke en cookie
// Retourne: redirect vers /feed ou erreur 401
//////////
routesAuth.post("/login", async (requete, reponse) => {
  const { email, password } = requete.body || {};
  if (!email || !password) return reponse.status(400).send("missing fields");

  const utilisateur = await queryOne("SELECT id, email, passwordHash FROM User WHERE email = ?", [email]);
  if (!utilisateur) return reponse.status(401).send("bad credentials");

  const motDePasseValide = await bcrypt.compare(password, utilisateur.passwordHash);
  if (!motDePasseValide) return reponse.status(401).send("bad credentials");

  const jeton = jwt.sign({ sub: utilisateur.id, email: utilisateur.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  definirCookieAuthentification(reponse, jeton);
  reponse.redirect("/feed");
});

//////////
// Déconnecte l'utilisateur en supprimant le cookie JWT
// Redirige vers la page de login
// Retourne: redirect vers /auth/login
//////////
routesAuth.post("/logout", (requete, reponse) => {
  reponse.clearCookie("token");
  reponse.redirect("/auth/login");
});






