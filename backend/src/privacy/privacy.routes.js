import express from "express";
import { query, queryOne } from "../db.js";
import { exigerAuthentification } from "../auth/auth.middleware.js";

export const routesConfidentialite = express.Router();

//////////
// Bloque un utilisateur
// Ajoute une entrée dans UserBlock
// Retourne: redirect vers la page précédente
//////////
routesConfidentialite.post("/block/:id", exigerAuthentification, async (requete, reponse) => {
  const idCible = Number(requete.params.id);
  const urlPrecedente = requete.get("referer") || "/";

  if (!Number.isFinite(idCible) || idCible === requete.user.id) {
    return reponse.redirect(urlPrecedente);
  }

  try {
    await query(
      "INSERT INTO UserBlock (blockerId, blockedId) VALUES (?, ?)",
      [requete.user.id, idCible]
    ).catch(() => null);

    reponse.redirect(urlPrecedente);
  } catch (erreur) {
    console.error("Erreur lors du blocage:", erreur);
    reponse.redirect(urlPrecedente);
  }
});

//////////
// Débloque un utilisateur
// Supprime une entrée de UserBlock
// Retourne: redirect vers la page précédente
//////////
routesConfidentialite.post("/unblock/:id", exigerAuthentification, async (requete, reponse) => {
  const idCible = Number(requete.params.id);
  const urlPrecedente = requete.get("referer") || "/";

  if (!Number.isFinite(idCible)) {
    return reponse.redirect(urlPrecedente);
  }

  try {
    await query(
      "DELETE FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
      [requete.user.id, idCible]
    ).catch(() => null);

    reponse.redirect(urlPrecedente);
  } catch (erreur) {
    console.error("Erreur lors du déblocage:", erreur);
    reponse.redirect(urlPrecedente);
  }
});

/**
 * Rend muet un utilisateur
 */
routesConfidentialite.post("/mute/:id", exigerAuthentification, async (requete, reponse) => {
  const idCible = Number(requete.params.id);
  const urlPrecedente = requete.get("referer") || "/";

  if (!Number.isFinite(idCible) || idCible === requete.user.id) {
    return reponse.redirect(urlPrecedente);
  }

  try {
    await query(
      "INSERT INTO UserMute (muterId, mutedId) VALUES (?, ?)",
      [requete.user.id, idCible]
    ).catch(() => null);

    reponse.redirect(urlPrecedente);
  } catch (erreur) {
    console.error("Erreur lors du rendu muet:", erreur);
    reponse.redirect(urlPrecedente);
  }
});

/**
 * Retire le mute d'un utilisateur
 */
routesConfidentialite.post("/unmute/:id", exigerAuthentification, async (requete, reponse) => {
  const idCible = Number(requete.params.id);
  const urlPrecedente = requete.get("referer") || "/";

  if (!Number.isFinite(idCible)) {
    return reponse.redirect(urlPrecedente);
  }

  try {
    await query(
      "DELETE FROM UserMute WHERE muterId = ? AND mutedId = ?",
      [requete.user.id, idCible]
    ).catch(() => null);

    reponse.redirect(urlPrecedente);
  } catch (erreur) {
    console.error("Erreur lors du retrait du mute:", erreur);
    reponse.redirect(urlPrecedente);
  }
});

/**
 * Mettre à jour les paramètres de confidentialité du profil
 */
routesConfidentialite.post("/profile-settings", exigerAuthentification, async (requete, reponse) => {
  const { profileVisibility, canReceiveMessages } = requete.body;

  try {
    // Vérifier si un enregistrement existe déjà
    const existant = await queryOne(
      "SELECT * FROM UserPrivacy WHERE userId = ?",
      [requete.user.id]
    );

    if (existant) {
      await query(
        "UPDATE UserPrivacy SET profileVisibility = ?, canReceiveMessages = ? WHERE userId = ?",
        [profileVisibility || "PUBLIC", canReceiveMessages === "true" || canReceiveMessages === "on", requete.user.id]
      );
    } else {
      await query(
        "INSERT INTO UserPrivacy (userId, profileVisibility, canReceiveMessages) VALUES (?, ?, ?)",
        [requete.user.id, profileVisibility || "PUBLIC", canReceiveMessages === "true" || canReceiveMessages === "on"]
      );
    }

    reponse.redirect(`/profiles/${requete.user.id}/edit`);
  } catch (erreur) {
    console.error("Erreur lors de la mise à jour des paramètres de confidentialité:", erreur);
    reponse.redirect(`/profiles/${requete.user.id}/edit`);
  }
});






