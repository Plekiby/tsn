import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { routesAuth } from "./auth/auth.routes.js";
import { routesPosts } from "./posts/posts.routes.js";
import { routesUtilisateurs } from "./users/users.routes.js";
import { routesProfils } from "./users/profiles.routes.js";
import { routesInterets } from "./interests/interests.routes.js";
import { routesAmis } from "./friends/friends.routes.js";
import { routesCommentaires } from "./comments/comments.routes.js";
import { routesNotifications } from "./notifications/notifications.routes.js";
import { routesTempsReel } from "./realtime/realtime.routes.js";
import { routesGroupes } from "./groups/groups.routes.js";
import { routesEvenements } from "./events/events.routes.js";
import { routesInvitationsGroupes } from "./groupInvites/groupInvites.routes.js";
import { routesLiensInvitationsGroupes } from "./groupInvites/groupInviteLinks.routes.js";
import { routesMessages } from "./messages/messages.routes.js";
import { routesConfidentialite } from "./privacy/privacy.routes.js";
import { ajouterCompteurNotificationsNonLues } from "./notifications/unread.middleware.js";
import { ajouterCompteurMessagesNonLus } from "./messages/unreadMessages.middleware.js";
import { testerConnectionSMTP } from "./auth/email.service.js";

const app = express();
app.use(express.urlencoded({ extended: true })); // forms
app.use(express.json());
app.use(cookieParser());
app.use(ajouterCompteurNotificationsNonLues);
app.use(ajouterCompteurMessagesNonLus);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(__dirname, ".."); // Go up one level to backend/

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use("/public", express.static(path.join(baseDir, "public")));
app.use("/uploads", express.static(path.join(baseDir, "public", "uploads")));

// Routes
app.use("/auth", routesAuth);
app.use("/posts", routesPosts);
app.use("/users", routesUtilisateurs);
app.use("/profiles", routesProfils);
app.use("/interests", routesInterets);
app.use("/friends", routesAmis);
app.use("/notifications", routesNotifications);
app.use("/messages", routesMessages);
app.use("/groups", routesGroupes);
app.use("/events", routesEvenements);
app.use("/privacy", routesConfidentialite);
app.use(routesEvenements);
app.use(routesTempsReel);
app.use(routesCommentaires);
app.use(routesInvitationsGroupes);
app.use(routesLiensInvitationsGroupes);

app.get("/feed", (requete, reponse) => reponse.redirect("/posts/feed"));

app.get("/", (requete, reponse) => reponse.redirect("/posts/feed"));

// 404
app.use((requete, reponse) => reponse.status(404).render("errors/404"));

const port = process.env.PORT || 3000;
app.listen(port, async () => {  
  try {
    await testerConnectionSMTP();
  } catch (erreur) {
    console.error("Erreur SMTP", erreur.message);
  }
});






