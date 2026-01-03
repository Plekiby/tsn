import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { authRouter } from "./auth/auth.routes.js";
import { postsRouter } from "./posts/posts.routes.js";
import { usersRouter } from "./users/users.routes.js";
import { interestsRouter } from "./interests/interests.routes.js";
import { friendsRouter } from "./friends/friends.routes.js";
import { commentsRoutes } from "./comments/comments.routes.js";

const app = express();
app.use(express.urlencoded({ extended: true })); // forms
app.use(express.json());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use("/public", express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/users", usersRouter);
app.use("/interests", interestsRouter);
app.use("/friends", friendsRouter);

// ✅ COMMENTS ROUTES (IMPORTANT: avant 404)
app.use(commentsRoutes);

app.get("/feed", (req, res) => res.redirect("/posts/feed"));

// Home redirect
app.get("/", (req, res) => res.redirect("/posts/feed"));

// 404
app.use((req, res) => res.status(404).render("errors/404"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on :${port}`));
