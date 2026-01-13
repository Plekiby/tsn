import express from "express";
import { query, queryOne } from "../db.js";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const routesProfils = express.Router();

// Configuration multer pour les uploads
const stockage = multer.diskStorage({
  destination: async (requete, fichier, callback) => {
    const repertoireUpload = path.join(__dirname, "../public/uploads");
    try {
      await fs.mkdir(repertoireUpload, { recursive: true });
    } catch {}
    callback(null, repertoireUpload);
  },
  filename: (requete, fichier, callback) => {
    const suffixeUnique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(null, fichier.fieldname + "-" + suffixeUnique + path.extname(fichier.originalname));
  }
});

const telechargement = multer({
  storage: stockage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (requete, fichier, callback) => {
    const typesAutorises = /jpeg|jpg|png|gif|webp/;
    const extension = typesAutorises.test(path.extname(fichier.originalname).toLowerCase());
    const type = typesAutorises.test(fichier.mimetype);
    if (type && extension) {
      return callback(null, true);
    }
    callback(new Error("Seuls les fichiers images sont autorisés"));
  }
});

//////////
// Affiche le profil public d'un utilisateur
// Vérifie les permissions de visibilité (PRIVATE, FOLLOWERS, PUBLIC)
// Charge les intérêts et les derniers posts
// Retourne: vue profile avec données complètes
//////////
routesProfils.get("/:id", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateur = Number(requete.params.id);
  if (!Number.isFinite(idUtilisateur)) {
    return reponse.redirect("/feed");
  }

  try {
    // Vérifier si on est bloqué par cet utilisateur
    const estBloque = await queryOne(
      "SELECT * FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
      [idUtilisateur, requete.user.id]
    );

    if (estBloque && idUtilisateur !== requete.user.id) {
      return reponse.status(403).render("errors/404", { message: "Vous n'avez pas accès à ce profil" });
    }

    const profil = await queryOne(`
      SELECT
        u.id, u.displayName, u.email, u.avatar, u.banner, u.bio, u.location, u.website, u.dateOfBirth, u.createdAt,
        (SELECT COUNT(*) FROM Post WHERE authorId = u.id) as postsCount,
        (SELECT COUNT(*) FROM Follow WHERE followedId = u.id) as followersCount,
        (SELECT COUNT(*) FROM Follow WHERE followerId = u.id) as followingCount,
        up.profileVisibility, up.canReceiveMessages
      FROM User u
      LEFT JOIN UserPrivacy up ON u.id = up.userId
      WHERE u.id = ?
    `, [idUtilisateur]);

    if (!profil) {
      return reponse.status(404).render("errors/404");
    }

    // Récupérer les intérêts
    const interets = await query(`
      SELECT i.name
      FROM UserInterest ui
      JOIN Interest i ON ui.interestId = i.id
      WHERE ui.userId = ?
    `, [idUtilisateur]);

    // Vérifier les permissions d'accès
    const estMonProfil = requete.user.id === idUtilisateur;
    const visibilite = profil.profileVisibility || "PUBLIC";
    let peutVoirPosts = true;
    let restrictionAcces = null;

    if (!estMonProfil && visibilite === "PRIVATE") {
      peutVoirPosts = false;
      restrictionAcces = "private";
    }

    if (!estMonProfil && visibilite === "FOLLOWERS") {
      const jeSuisAbonne = await queryOne(
        "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
        [requete.user.id, idUtilisateur]
      );

      if (!jeSuisAbonne) {
        peutVoirPosts = false;
        restrictionAcces = "followers";
      }
    }

    // Récupérer les posts
    let publications = [];
    if (peutVoirPosts) {
      publications = await query(`
        SELECT
          p.id, p.content, p.createdAt,
          (SELECT COUNT(*) FROM Comment WHERE postId = p.id) as commentsCount,
          (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id) as likesCount,
          (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id AND userId = ?) as userLiked
        FROM Post p
        WHERE p.authorId = ?
        ORDER BY p.createdAt DESC
        LIMIT 10
      `, [requete.user.id, idUtilisateur]);
    }

    // Vérifier les relations
    const jeSuisAbonne = await queryOne(
      "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
      [requete.user.id, idUtilisateur]
    );

    const jeLeBloquerai = await queryOne(
      "SELECT * FROM UserBlock WHERE blockerId = ? AND blockedId = ?",
      [requete.user.id, idUtilisateur]
    );

    const jeLourdeMute = await queryOne(
      "SELECT * FROM UserMute WHERE muterId = ? AND mutedId = ?",
      [requete.user.id, idUtilisateur]
    );

    reponse.render("users/profile", {
      user: requete.user,
      profile: {
        ...profil,
        _count: {
          posts: profil.postsCount,
          followers: profil.followersCount,
          following: profil.followingCount
        },
        privacy: {
          profileVisibility: profil.profileVisibility,
          canReceiveMessages: profil.canReceiveMessages
        }
      },
      isFollowing: !!jeSuisAbonne,
      isOwnProfile: estMonProfil,
      interests: interets.map(i => i.name),
      posts: publications.map(p => ({
        ...p,
        _count: {
          comments: p.commentsCount,
          likes: p.likesCount
        },
        likes: p.userLiked ? [{ userId: requete.user.id }] : []
      })),
      isBlocked: !!jeLeBloquerai,
      isMuted: !!jeLourdeMute,
      canViewPosts: peutVoirPosts,
      accessRestriction: restrictionAcces,
      profileVisibility: visibilite,
      canReceiveMessages: profil.canReceiveMessages ?? true
    });
  } catch (erreur) {
    console.error("Erreur lors du chargement du profil:", erreur);
    reponse.status(500).render("errors/500");
  }
});

//////////
// Affiche le formulaire d'édition du profil personnel
// Charge les données actuelles de l'utilisateur
// Retourne: vue profile-edit avec données pré-remplies
//////////
routesProfils.get("/:id/edit", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateur = Number(requete.params.id);

  if (!Number.isFinite(idUtilisateur) || idUtilisateur !== requete.user.id) {
    return reponse.redirect("/feed");
  }

  try {
    const profil = await queryOne(`
      SELECT
        u.id, u.displayName, u.email, u.avatar, u.banner, u.bio, u.location, u.website, u.dateOfBirth,
        up.profileVisibility, up.canReceiveMessages
      FROM User u
      LEFT JOIN UserPrivacy up ON u.id = up.userId
      WHERE u.id = ?
    `, [idUtilisateur]);

    if (!profil) {
      return reponse.status(404).render("errors/404");
    }

    reponse.render("users/profile-edit", {
      user: requete.user,
      profile: {
        ...profil,
        privacy: {
          profileVisibility: profil.profileVisibility,
          canReceiveMessages: profil.canReceiveMessages
        }
      }
    });
  } catch (erreur) {
    console.error("Erreur lors du chargement de l'édition:", erreur);
    reponse.status(500).render("errors/500");
  }
});

//////////
// Sauvegarde les modifications du profil
// Met à jour les infos personnelles et images (avatar, bannière)
// Gère aussi les paramètres de confidentialité
// Retourne: redirect /profiles/:id
//////////
routesProfils.post(
  "/:id/edit",
  exigerAuthentification,
  telechargement.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 }
  ]),
  async (requete, reponse) => {
    const idUtilisateur = Number(requete.params.id);

    if (!Number.isFinite(idUtilisateur) || idUtilisateur !== requete.user.id) {
      return reponse.redirect("/feed");
    }

    try {
      const { displayName, bio, location, website, dateOfBirth, profileVisibility, canReceiveMessages } = requete.body;

      const miseAJour = [];
      const valeurs = [];

      if (displayName?.trim()) {
        miseAJour.push("displayName = ?");
        valeurs.push(displayName.trim());
      }

      if (bio !== undefined) {
        miseAJour.push("bio = ?");
        valeurs.push(bio?.trim() || null);
      }

      if (location !== undefined) {
        miseAJour.push("location = ?");
        valeurs.push(location?.trim() || null);
      }

      if (website !== undefined) {
        miseAJour.push("website = ?");
        valeurs.push(website?.trim() || null);
      }

      if (dateOfBirth && dateOfBirth.trim()) {
        miseAJour.push("dateOfBirth = ?");
        valeurs.push(new Date(dateOfBirth));
      }

      if (requete.files?.avatar && requete.files.avatar[0]) {
        miseAJour.push("avatar = ?");
        valeurs.push("/public/uploads/" + requete.files.avatar[0].filename);
      }

      if (requete.files?.banner && requete.files.banner[0]) {
        miseAJour.push("banner = ?");
        valeurs.push("/public/uploads/" + requete.files.banner[0].filename);
      }

      if (miseAJour.length > 0) {
        miseAJour.push("updatedAt = NOW()");
        valeurs.push(idUtilisateur);
        await query(
          `UPDATE User SET ${miseAJour.join(", ")} WHERE id = ?`,
          valeurs
        );
      }

      // Mettre à jour la confidentialité
      if (profileVisibility || canReceiveMessages !== undefined) {
        const confidentialiteExistante = await queryOne(
          "SELECT * FROM UserPrivacy WHERE userId = ?",
          [idUtilisateur]
        );

        if (confidentialiteExistante) {
          await query(
            "UPDATE UserPrivacy SET profileVisibility = ?, canReceiveMessages = ? WHERE userId = ?",
            [
              profileVisibility || confidentialiteExistante.profileVisibility,
              canReceiveMessages === 'true' || canReceiveMessages === true,
              idUtilisateur
            ]
          );
        } else {
          await query(
            "INSERT INTO UserPrivacy (userId, profileVisibility, canReceiveMessages) VALUES (?, ?, ?)",
            [
              idUtilisateur,
              profileVisibility || 'PUBLIC',
              canReceiveMessages === 'true' || canReceiveMessages === true
            ]
          );
        }
      }

      reponse.redirect(`/profiles/${idUtilisateur}`);
    } catch (erreur) {
      console.error("Erreur lors de la mise à jour:", erreur);
      reponse.status(500).render("errors/500");
    }
  }
);



