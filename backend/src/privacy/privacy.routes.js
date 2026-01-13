import express from "express";
import { prisma } from "../prisma.js";
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
    await prisma.userBlock.create({
      data: {
        blockerId: req.user.id,
        blockedId: targetId
      }
    }).catch(() => null); // Ignore si déjà bloqué

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
    await prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: targetId
        }
      }
    }).catch(() => null);

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
    await prisma.userMute.create({
      data: {
        muterId: req.user.id,
        mutedId: targetId
      }
    }).catch(() => null);

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
    await prisma.userMute.delete({
      where: {
        muterId_mutedId: {
          muterId: req.user.id,
          mutedId: targetId
        }
      }
    }).catch(() => null);

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
    const privacy = await prisma.userPrivacy.upsert({
      where: { userId: req.user.id },
      update: {
        profileVisibility: profileVisibility || "PUBLIC",
        canReceiveMessages: canReceiveMessages === "on"
      },
      create: {
        userId: req.user.id,
        profileVisibility: profileVisibility || "PUBLIC",
        canReceiveMessages: canReceiveMessages === "on"
      }
    });

    res.redirect(`/profiles/${req.user.id}/edit`);
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    res.redirect(`/profiles/${req.user.id}/edit`);
  }
});
