import express from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";

export const interestsRouter = express.Router();

// list + manage
interestsRouter.get("/", requireAuth, async (req, res) => {
  const interests = await prisma.interest.findMany({ orderBy: { name: "asc" } });

  const mine = await prisma.userInterest.findMany({
    where: { userId: req.user.id },
    include: { interest: true }
  });

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

  await prisma.interest.create({ data: { name } }).catch(() => {});
  res.redirect("/interests");
});

// toggle user interest
interestsRouter.post("/:id/toggle", requireAuth, async (req, res) => {
  const interestId = Number(req.params.id);
  if (!Number.isFinite(interestId)) return res.redirect("/interests");

  try {
    await prisma.userInterest.create({ data: { userId: req.user.id, interestId } });
  } catch {
    await prisma.userInterest
      .delete({ where: { userId_interestId: { userId: req.user.id, interestId } } })
      .catch(() => {});
  }
  res.redirect("/interests");
});
