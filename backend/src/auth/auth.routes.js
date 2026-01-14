import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query, queryOne } from "../db.js";
import { envoyerEmailVerification } from "./email.service.js";

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
// Crée un nouvel utilisateur avec email non vérifié
// Génère un token de vérification
// Envoie un email de confirmation
// Retourne: redirect vers page d'attente de confirmation
//////////
routesAuth.post("/register", async (requete, reponse) => {
  try {
    const { email, password, displayName } = requete.body || {};

    // Valide chaque champ
    if (!displayName || displayName.trim().length < 2) {
      return reponse.status(400).json({
        erreur: "Le pseudo doit contenir au moins 2 caractères."
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reponse.status(400).json({
        erreur: "Veuillez entrer une adresse email valide."
      });
    }

    if (!password || password.length < 6) {
      return reponse.status(400).json({
        erreur: "Le mot de passe doit contenir au moins 6 caractères."
      });
    }

    // Vérifie si l'email existe déjà
    const existe = await queryOne("SELECT id FROM User WHERE email = ?", [email.toLowerCase()]);
    if (existe) {
      return reponse.status(409).json({
        erreur: "Cet email est déjà utilisé. Essaie de te connecter ou utilise une autre adresse."
      });
    }

    // Hash le mot de passe
    const hashMotDePasse = await bcrypt.hash(password, 12);

    // Génère un token de vérification unique
    const jetonVerification = crypto.randomBytes(16).toString("hex");
    const expireLe = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Crée l'utilisateur
    const resultat = await query(
      "INSERT INTO User (email, passwordHash, displayName, isEmailVerified, emailVerificationToken, emailVerificationExpiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [email.toLowerCase(), hashMotDePasse, displayName.trim(), false, jetonVerification, expireLe]
    );

    const idUtilisateur = resultat.insertId;
    console.log(`✓ Nouvel utilisateur créé: ${email} (ID: ${idUtilisateur})`);

    // Envoie l'email de vérification
    const emailEnvoye = await envoyerEmailVerification(email, jetonVerification, displayName);

    if (!emailEnvoye) {
      // Si l'email n'a pas pu être envoyé, supprime l'utilisateur
      await query("DELETE FROM User WHERE id = ?", [idUtilisateur]);
      return reponse.status(500).json({
        erreur: "Impossible d'envoyer l'email de confirmation. Veuillez réessayer."
      });
    }

    reponse.redirect(`/auth/verification-email?email=${encodeURIComponent(email)}`);
  } catch (erreur) {
    console.error("Erreur à l'inscription:", erreur.message);
    reponse.status(500).json({
      erreur: "Une erreur est survenue lors de l'inscription. Veuillez réessayer."
    });
  }
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
  if (!email || !password) {
    return reponse.status(400).json({
      erreur: "Email et mot de passe sont obligatoires."
    });
  }

  const utilisateur = await queryOne("SELECT id, email, passwordHash, isEmailVerified FROM User WHERE email = ?", [email]);
  if (!utilisateur) {
    return reponse.status(401).json({
      erreur: "Email ou mot de passe incorrect."
    });
  }

  // Vérifie que l'email est confirmé
  if (!utilisateur.isEmailVerified) {
    return reponse.status(403).json({
      erreur: "Ton email n'a pas été vérifié.",
      emailNotVerified: true,
      email: utilisateur.email
    });
  }

  const motDePasseValide = await bcrypt.compare(password, utilisateur.passwordHash);
  if (!motDePasseValide) {
    return reponse.status(401).json({
      erreur: "Email ou mot de passe incorrect."
    });
  }

  const jeton = jwt.sign({ sub: utilisateur.id, email: utilisateur.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  definirCookieAuthentification(reponse, jeton);
  reponse.redirect("/feed");
});

//////////
// Page d'attente de confirmation d'email
// Affiche le formulaire d'attente
// Retourne: view auth/email-verification
//////////
routesAuth.get("/verification-email", (requete, reponse) => {
  reponse.render("auth/email-verification", { erreur: null });
});

//////////
// Vérifie le token d'email et active le compte
// Marque isEmailVerified = true
// Connecte l'utilisateur automatiquement
// Retourne: redirect vers /feed ou erreur
//////////
routesAuth.get("/verifier-email/:jeton", async (requete, reponse) => {
  const { jeton } = requete.params;
  if (!jeton || jeton.length !== 32) {
    return reponse.status(400).render("auth/email-verification", { erreur: "Token invalide" });
  }

  const utilisateur = await queryOne(
    "SELECT id, email, emailVerificationExpiresAt FROM User WHERE emailVerificationToken = ? AND isEmailVerified = ?",
    [jeton, false]
  );

  if (!utilisateur) {
    return reponse.status(404).render("auth/email-verification", { erreur: "Lien expiré ou invalide" });
  }

  // Vérifie l'expiration du token (24h)
  if (new Date() > utilisateur.emailVerificationExpiresAt) {
    return reponse.status(410).render("auth/email-verification", { erreur: "Lien expiré. Merci de te réinscrire." });
  }

  // Active le compte
  await query(
    "UPDATE User SET isEmailVerified = ?, emailVerificationToken = NULL, emailVerificationExpiresAt = NULL WHERE id = ?",
    [true, utilisateur.id]
  );

  // Connecte l'utilisateur automatiquement
  const jetonJWT = jwt.sign({ sub: utilisateur.id, email: utilisateur.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  definirCookieAuthentification(reponse, jetonJWT);

  reponse.redirect("/feed");
});

//////////
// Renvoie l'email de vérification si le token a expiré
// Génère un nouveau token valide 24h
// Envoie l'email de confirmation
// Retourne: JSON avec message de succès
//////////
routesAuth.post("/renvoyer-email", async (requete, reponse) => {
  try {
    const { email } = requete.body || {};

    if (!email) {
      return reponse.status(400).json({
        erreur: "L'adresse email est requise."
      });
    }

    const utilisateur = await queryOne(
      "SELECT id, displayName, isEmailVerified FROM User WHERE email = ?",
      [email.toLowerCase()]
    );

    if (!utilisateur) {
      return reponse.status(404).json({
        erreur: "Aucun compte trouvé avec cette adresse email."
      });
    }

    if (utilisateur.isEmailVerified) {
      return reponse.status(400).json({
        erreur: "Votre email est déjà vérifié. Vous pouvez vous connecter."
      });
    }

    // Génère un nouveau token de vérification
    const jetonVerification = crypto.randomBytes(16).toString("hex");
    const expireLe = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Mise à jour du token
    await query(
      "UPDATE User SET emailVerificationToken = ?, emailVerificationExpiresAt = ? WHERE id = ?",
      [jetonVerification, expireLe, utilisateur.id]
    );

    // Renvoie l'email
    const emailEnvoye = await envoyerEmailVerification(email, jetonVerification, utilisateur.displayName);

    if (!emailEnvoye) {
      return reponse.status(500).json({
        erreur: "Impossible de renvoyer l'email. Veuillez réessayer plus tard."
      });
    }

    reponse.json({
      success: true,
      message: "Un nouvel email de vérification a été envoyé à " + email
    });
  } catch (erreur) {
    console.error("Erreur renvoyer-email:", erreur);
    reponse.status(500).json({
      erreur: "Une erreur est survenue. Veuillez réessayer."
    });
  }
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






