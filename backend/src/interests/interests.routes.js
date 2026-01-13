import express from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../auth/auth.middleware.js";

export const interestsRouter = express.Router();

// list + manage
interestsRouter.get("/", requireAuth, async (req, res) => {
  const interests = await query("SELECT * FROM Interest ORDER BY name ASC");

  const mine = await query(`
    SELECT
      ui.*,
      i.id as interest_id,
      i.name as interest_name
    FROM UserInterest ui
    JOIN Interest i ON ui.interestId = i.id
    WHERE ui.userId = ?
  `, [req.user.id]);

  const mySet = new Set(mine.map(x => x.interestId));

  res.render("interests/index", {
    user: req.user,
    interests,
    mySet
  });
});

// create interest (admin-ish, but ok for demo)
interestsRouter.post("/", requireAuth, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.redirect("/interests");

  await query("INSERT INTO Interest (name) VALUES (?)", [name]).catch(() => {});
  res.redirect("/interests");
});

// toggle user interest
interestsRouter.post("/:id/toggle", requireAuth, async (req, res) => {
  const interestId = Number(req.params.id);
  if (!Number.isFinite(interestId)) return res.redirect("/interests");

  const existing = await queryOne(
    "SELECT * FROM UserInterest WHERE userId = ? AND interestId = ?",
    [req.user.id, interestId]
  );

  if (existing) {
    await query(
      "DELETE FROM UserInterest WHERE userId = ? AND interestId = ?",
      [req.user.id, interestId]
    ).catch(() => {});
  } else {
    await query(
      "INSERT INTO UserInterest (userId, interestId) VALUES (?, ?)",
      [req.user.id, interestId]
    ).catch(() => {});
  }

  res.redirect("/interests");
});
