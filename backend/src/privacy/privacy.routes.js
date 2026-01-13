import express from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../auth/auth.middleware.js";

export const privacyRouter = express.Router();

/**
 * Bloquer un utilisateur
 */
privacyRouter.post("/block/:id", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const back = req.get("referer") || "/";

  if (!Number.isFinite(targetId) || targetId === req.user.id) {
    return res.redirect(back);
  }

  try {
    await query(
      "INSERT INTO UserBlock (blockerId, blockedId) VALUES (?, ?)",
      [req.user.id, targetId]
    ).catch(() => null); // Ignore si déjà bloqué

    res.redirect(back);
  } catch (error) {
    console.error("Error blocking user:", error);
    res.redirect(back);
  }
});

/**
 * Débloquer un utilisateur
 */
privacyRouter.post("/unblock/:id", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const back = req.get("referer") || "/";

  if (!Number.isFinite(targetId)) {
    return res.redirect(back);
  }

  try {
    await query(
      "DELETE FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
      [req.user.id, targetId]
    ).catch(() => null);

    res.redirect(back);
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.redirect(back);
  }
});

/**
 * Mute un utilisateur
 */
privacyRouter.post("/mute/:id", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const back = req.get("referer") || "/";

  if (!Number.isFinite(targetId) || targetId === req.user.id) {
    return res.redirect(back);
  }

  try {
    await query(
      "INSERT INTO UserMute (muterId, mutedId) VALUES (?, ?)",
      [req.user.id, targetId]
    ).catch(() => null);

    res.redirect(back);
  } catch (error) {
    console.error("Error muting user:", error);
    res.redirect(back);
  }
});

/**
 * Unmute un utilisateur
 */
privacyRouter.post("/unmute/:id", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const back = req.get("referer") || "/";

  if (!Number.isFinite(targetId)) {
    return res.redirect(back);
  }

  try {
    await query(
      "DELETE FROM UserMute WHERE muterId = ? AND mutedId = ?",
      [req.user.id, targetId]
    ).catch(() => null);

    res.redirect(back);
  } catch (error) {
    console.error("Error unmuting user:", error);
    res.redirect(back);
  }
});

/**
 * Mettre à jour les paramètres de confidentialité du profil
 */
privacyRouter.post("/profile-settings", requireAuth, async (req, res) => {
  const { profileVisibility, canReceiveMessages } = req.body;

  try {
    // Vérifier si un enregistrement existe déjà
    const existing = await queryOne(
      "SELECT * FROM UserPrivacy WHERE userId = ?",
      [req.user.id]
    );

    if (existing) {
      await query(
        "UPDATE UserPrivacy SET profileVisibility = ?, canReceiveMessages = ? WHERE userId = ?",
        [profileVisibility || "PUBLIC", canReceiveMessages === "on", req.user.id]
      );
    } else {
      await query(
        "INSERT INTO UserPrivacy (userId, profileVisibility, canReceiveMessages) VALUES (?, ?, ?)",
        [req.user.id, profileVisibility || "PUBLIC", canReceiveMessages === "on"]
      );
    }

    res.redirect(`/profiles/${req.user.id}/edit`);
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.redirect(`/profiles/${req.user.id}/edit`);
  }
});
