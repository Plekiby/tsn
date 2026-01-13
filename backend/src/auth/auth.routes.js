import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query, queryOne } from "../db.js";

export const authRouter = express.Router();

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "prod"
  });
}

authRouter.get("/login", (req, res) => res.render("auth/login"));
authRouter.get("/register", (req, res) => res.render("auth/register"));

authRouter.post("/register", async (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password || !displayName) return res.status(400).send("missing fields");

  const exists = await queryOne("SELECT id FROM User WHERE email = ?", [email]);
  if (exists) return res.status(409).send("email already used");

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    "INSERT INTO User (email, passwordHash, displayName, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
    [email, passwordHash, displayName]
  );

  const userId = result.insertId;
  const token = jwt.sign({ sub: userId, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  setAuthCookie(res, token);
  res.redirect("/feed");
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).send("missing fields");

  const user = await queryOne("SELECT id, email, passwordHash FROM User WHERE email = ?", [email]);
  if (!user) return res.status(401).send("bad credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).send("bad credentials");

  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  setAuthCookie(res, token);
  res.redirect("/feed");
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/auth/login");
});
