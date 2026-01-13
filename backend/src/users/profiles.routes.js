import express from "express";
import { query, queryOne } from "../db.js";
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
    const isBlocked = await queryOne(
      "SELECT * FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
      [userId, req.user.id]
    );

    if (isBlocked && userId !== req.user.id) {
      return res.status(403).render("errors/404", { message: "Vous n'avez pas accès à ce profil" });
    }

    const profile = await queryOne(`
      SELECT
        u.id, u.displayName, u.email, u.avatar, u.banner, u.bio, u.location, u.website, u.dateOfBirth, u.createdAt,
        (SELECT COUNT(*) FROM Post WHERE authorId = u.id) as postsCount,
        (SELECT COUNT(*) FROM Follow WHERE followedId = u.id) as followersCount,
        (SELECT COUNT(*) FROM Follow WHERE followerId = u.id) as followingCount,
        up.profileVisibility, up.canReceiveMessages
      FROM User u
      LEFT JOIN UserPrivacy up ON u.id = up.userId
      WHERE u.id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).render("errors/404");
    }

    // Récupérer les intérêts
    const interests = await query(`
      SELECT i.name
      FROM UserInterest ui
      JOIN Interest i ON ui.interestId = i.id
      WHERE ui.userId = ?
    `, [userId]);

    // Vérifier les permissions d'accès au profil
    const isOwnProfile = req.user.id === userId;
    const privacy = profile.profileVisibility || "PUBLIC";
    let canViewPosts = true;
    let accessRestriction = null;

    if (!isOwnProfile && privacy === "PRIVATE") {
      canViewPosts = false;
      accessRestriction = "private";
    }

    if (!isOwnProfile && privacy === "FOLLOWERS") {
      const isFollowingProfile = await queryOne(
        "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
        [req.user.id, userId]
      );

      if (!isFollowingProfile) {
        canViewPosts = false;
        accessRestriction = "followers";
      }
    }

    // Récupérer les posts si l'utilisateur a accès
    let posts = [];
    if (canViewPosts) {
      posts = await query(`
        SELECT
          p.id, p.content, p.createdAt,
          (SELECT COUNT(*) FROM Comment WHERE postId = p.id) as commentsCount,
          (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id) as likesCount,
          (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id AND userId = ?) as userLiked
        FROM Post p
        WHERE p.authorId = ?
        ORDER BY p.createdAt DESC
        LIMIT 10
      `, [req.user.id, userId]);
    }

    // Vérifier si l'utilisateur actuel suit ce profil
    const isFollowing = await queryOne(
      "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
      [req.user.id, userId]
    );

    // Vérifier si utilisateur est bloqué par l'utilisateur actuel
    const userIsBlocked = await queryOne(
      "SELECT * FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
      [req.user.id, userId]
    );

    // Vérifier si utilisateur est mute par l'utilisateur actuel
    const userIsMuted = await queryOne(
      "SELECT * FROM UserMute WHERE muterId = ? AND mutedId = ?",
      [req.user.id, userId]
    );

    res.render("users/profile", {
      user: req.user,
      profile: {
        ...profile,
        _count: {
          posts: profile.postsCount,
          followers: profile.followersCount,
          following: profile.followingCount
        },
        privacy: {
          profileVisibility: profile.profileVisibility,
          canReceiveMessages: profile.canReceiveMessages
        }
      },
      isFollowing: !!isFollowing,
      isOwnProfile,
      interests: interests.map(i => i.name),
      posts: posts.map(p => ({
        ...p,
        _count: {
          comments: p.commentsCount,
          likes: p.likesCount
        },
        likes: p.userLiked ? [{ userId: req.user.id }] : []
      })),
      isBlocked: !!userIsBlocked,
      isMuted: !!userIsMuted,
      canViewPosts,
      accessRestriction,
      profileVisibility: privacy,
      canReceiveMessages: profile.canReceiveMessages ?? true
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
    const profile = await queryOne(`
      SELECT
        u.id, u.displayName, u.email, u.avatar, u.banner, u.bio, u.location, u.website, u.dateOfBirth,
        up.profileVisibility, up.canReceiveMessages
      FROM User u
      LEFT JOIN UserPrivacy up ON u.id = up.userId
      WHERE u.id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).render("errors/404");
    }

    res.render("users/profile-edit", {
      user: req.user,
      profile: {
        ...profile,
        privacy: {
          profileVisibility: profile.profileVisibility,
          canReceiveMessages: profile.canReceiveMessages
        }
      }
    });
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

      const updates = [];
      const values = [];

      if (displayName?.trim()) {
        updates.push("displayName = ?");
        values.push(displayName.trim());
      }

      if (bio !== undefined) {
        updates.push("bio = ?");
        values.push(bio?.trim() || null);
      }

      if (location !== undefined) {
        updates.push("location = ?");
        values.push(location?.trim() || null);
      }

      if (website !== undefined) {
        updates.push("website = ?");
        values.push(website?.trim() || null);
      }

      // Gérer la date de naissance
      if (dateOfBirth && dateOfBirth.trim()) {
        updates.push("dateOfBirth = ?");
        values.push(new Date(dateOfBirth));
      }

      // Gérer l'avatar uploadé
      if (req.files?.avatar && req.files.avatar[0]) {
        updates.push("avatar = ?");
        values.push("/public/uploads/" + req.files.avatar[0].filename);
      }

      // Gérer la banner uploadée
      if (req.files?.banner && req.files.banner[0]) {
        updates.push("banner = ?");
        values.push("/public/uploads/" + req.files.banner[0].filename);
      }

      if (updates.length > 0) {
        updates.push("updatedAt = NOW()");
        values.push(userId);
        await query(
          `UPDATE User SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
      }

      // Mettre à jour les paramètres de confidentialité
      if (profileVisibility || canReceiveMessages !== undefined) {
        const existingPrivacy = await queryOne(
          "SELECT * FROM UserPrivacy WHERE userId = ?",
          [userId]
        );

        if (existingPrivacy) {
          await query(
            "UPDATE UserPrivacy SET profileVisibility = ?, canReceiveMessages = ? WHERE userId = ?",
            [
              profileVisibility || existingPrivacy.profileVisibility,
              canReceiveMessages === 'true' || canReceiveMessages === true,
              userId
            ]
          );
        } else {
          await query(
            "INSERT INTO UserPrivacy (userId, profileVisibility, canReceiveMessages) VALUES (?, ?, ?)",
            [
              userId,
              profileVisibility || 'PUBLIC',
              canReceiveMessages === 'true' || canReceiveMessages === true
            ]
          );
        }
      }

      res.redirect(`/profiles/${userId}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).render("errors/500");
    }
  }
);
