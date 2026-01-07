import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const profilesRouter = express.Router();

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../public/uploads");
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch {}
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Seuls les fichiers images sont autorisés"));
  }
});

/**
 * Page: consulter le profil d'un utilisateur
 */
profilesRouter.get("/:id", requireAuth, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isFinite(userId)) {
    return res.redirect("/feed");
  }

  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatar: true,
        banner: true,
        bio: true,
        location: true,
        website: true,
        dateOfBirth: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        },
        userInterests: {
          select: {
            interest: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).render("errors/404");
    }

    // Vérifier si l'utilisateur actuel suit ce profil
    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followedId: {
          followerId: req.user.id,
          followedId: userId
        }
      }
    });

    // Vérifier si c'est son propre profil
    const isOwnProfile = req.user.id === userId;

    res.render("users/profile", {
      user: req.user,
      profile,
      isFollowing: !!isFollowing,
      isOwnProfile,
      interests: profile.userInterests.map(ui => ui.interest.name)
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).render("errors/500");
  }
});

/**
 * Page: éditer son propre profil
 */
profilesRouter.get("/:id/edit", requireAuth, async (req, res) => {
  const userId = Number(req.params.id);

  // On ne peut éditer que son propre profil
  if (!Number.isFinite(userId) || userId !== req.user.id) {
    return res.redirect("/feed");
  }

  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatar: true,
        banner: true,
        bio: true,
        location: true,
        website: true,
        dateOfBirth: true
      }
    });

    if (!profile) {
      return res.status(404).render("errors/404");
    }

    res.render("users/profile-edit", { user: req.user, profile });
  } catch (error) {
    console.error("Error loading profile edit:", error);
    res.status(500).render("errors/500");
  }
});

/**
 * Action: mettre à jour son profil
 */
profilesRouter.post(
  "/:id/edit",
  requireAuth,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  async (req, res) => {
    const userId = Number(req.params.id);

    // On ne peut éditer que son propre profil
    if (!Number.isFinite(userId) || userId !== req.user.id) {
      return res.redirect("/feed");
    }

    try {
      const { displayName, bio, location, website, dateOfBirth } = req.body;

      const updateData = {
        displayName: displayName?.trim() || undefined,
        bio: bio?.trim() || null,
        location: location?.trim() || null,
        website: website?.trim() || null
      };

      // Gérer la date de naissance
      if (dateOfBirth && dateOfBirth.trim()) {
        updateData.dateOfBirth = new Date(dateOfBirth);
      }

      // Gérer l'avatar uploadé
      if (req.files?.avatar && req.files.avatar[0]) {
        updateData.avatar = "/public/uploads/" + req.files.avatar[0].filename;
      }

      // Gérer la banner uploadée
      if (req.files?.banner && req.files.banner[0]) {
        updateData.banner = "/public/uploads/" + req.files.banner[0].filename;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      res.redirect(`/profiles/${userId}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).render("errors/500");
    }
  }
);
