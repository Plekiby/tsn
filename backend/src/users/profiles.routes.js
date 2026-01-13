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
    // Vérifier si l'utilisateur actuel est bloqué
    const isBlocked = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: req.user.id
        }
      }
    });

    if (isBlocked && userId !== req.user.id) {
      return res.status(403).render("errors/404", { message: "Vous n'avez pas accès à ce profil" });
    }

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
        },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            content: true,
            createdAt: true,
            _count: {
              select: {
                comments: true,
                likes: true
              }
            },
            likes: {
              where: { userId: req.user.id },
              select: { userId: true }
            }
          }
        },
        privacy: {
          select: {
            profileVisibility: true,
            canReceiveMessages: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).render("errors/404");
    }

    // Vérifier les permissions d'accès au profil
    const isOwnProfile = req.user.id === userId;
    const privacy = profile.privacy?.profileVisibility || "PUBLIC";
    let canViewPosts = true;
    let accessRestriction = null;

    if (!isOwnProfile && privacy === "PRIVATE") {
      canViewPosts = false;
      accessRestriction = "private";
    }

    if (!isOwnProfile && privacy === "FOLLOWERS") {
      const isFollowingProfile = await prisma.follow.findUnique({
        where: {
          followerId_followedId: {
            followerId: req.user.id,
            followedId: userId
          }
        }
      });

      if (!isFollowingProfile) {
        canViewPosts = false;
        accessRestriction = "followers";
      }
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

    // Vérifier si utilisateur est bloqué par l'utilisateur actuel
    const userIsBlocked = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: req.user.id,
          blockedId: userId
        }
      }
    });

    // Vérifier si utilisateur est mute par l'utilisateur actuel
    const userIsMuted = await prisma.userMute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: req.user.id,
          mutedId: userId
        }
      }
    });

    res.render("users/profile", {
      user: req.user,
      profile,
      isFollowing: !!isFollowing,
      isOwnProfile,
      interests: profile.userInterests.map(ui => ui.interest.name),
      posts: canViewPosts ? profile.posts : [],
      isBlocked: !!userIsBlocked,
      isMuted: !!userIsMuted,
      canViewPosts,
      accessRestriction,
      profileVisibility: privacy,
      canReceiveMessages: profile.privacy?.canReceiveMessages ?? true
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
        dateOfBirth: true,
        privacy: {
          select: {
            profileVisibility: true,
            canReceiveMessages: true
          }
        }
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
      const { displayName, bio, location, website, dateOfBirth, profileVisibility, canReceiveMessages } = req.body;

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

      // Mettre à jour le profil
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // Mettre à jour les paramètres de confidentialité
      if (profileVisibility || canReceiveMessages !== undefined) {
        await prisma.userPrivacy.upsert({
          where: { userId },
          update: {
            profileVisibility: profileVisibility || undefined,
            canReceiveMessages: canReceiveMessages === 'true' || canReceiveMessages === true
          },
          create: {
            userId,
            profileVisibility: profileVisibility || 'PUBLIC',
            canReceiveMessages: canReceiveMessages === 'true' || canReceiveMessages === true
          }
        });
      }

      res.redirect(`/profiles/${userId}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).render("errors/500");
    }
  }
);
