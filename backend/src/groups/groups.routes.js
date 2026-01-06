import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";

export const groupsRouter = express.Router();

/* utils */
async function getMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
}

/**
 * GET /groups
 * - PUBLIC visibles
 * - PRIVATE visibles seulement si membre
 * - SECRET jamais visibles
 */
groupsRouter.get("/", requireAuth, async (req, res) => {
  const meId = req.user.id;

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { privacy: "PUBLIC" },
        {
          privacy: "PRIVATE",
          members: { some: { userId: meId } }
        }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, displayName: true } },
      _count: { select: { members: true } }
    }
  });

  const myMemberships = await prisma.groupMember.findMany({
    where: { userId: meId },
    include: { group: true }
  });

  res.render("groups/index", {
    user: req.user,
    groups,
    myMemberships
  });
});

/**
 * POST /groups
 * Create group (OWNER auto member)
 */
groupsRouter.post("/", requireAuth, async (req, res) => {
  const name = (req.body?.name || "").trim();
  const description = (req.body?.description || "").trim();
  const privacy = (req.body?.privacy || "PUBLIC").toUpperCase();

  const allowed = new Set(["PUBLIC", "PRIVATE", "SECRET"]);
  const safePrivacy = allowed.has(privacy) ? privacy : "PUBLIC";

  if (!name) return res.redirect("/groups");

  const group = await prisma.group.create({
    data: {
      name,
      description: description || null,
      privacy: safePrivacy,
      ownerId: req.user.id,
      members: {
        create: {
          userId: req.user.id,
          role: "OWNER"
        }
      }
    }
  });

  res.redirect(`/groups/${group.id}`);
});

/**
 * GET /groups/:id
 * - PUBLIC: page visible
 * - PRIVATE / SECRET: membre only
 */
groupsRouter.get("/:id", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: { select: { id: true, displayName: true } },
      _count: { select: { members: true } }
    }
  });
  if (!group) return res.redirect("/groups");

  const member = await getMembership(groupId, req.user.id);

  if (
    (group.privacy === "PRIVATE" && !member) ||
    (group.privacy === "SECRET" && !member)
  ) {
    return res.redirect("/groups");
  }

  const posts = member
    ? await prisma.post.findMany({
        where: { groupId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          author: { select: { id: true, displayName: true } },
          likes: { select: { userId: true } },
          comments: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              user: { select: { id: true, displayName: true } }
            }
          },
          _count: { select: { likes: true, comments: true } }
        }
      })
    : [];

  const events = member
    ? await prisma.event.findMany({
        where: { groupId },
        orderBy: { startAt: "asc" },
        include: {
          creator: { select: { id: true, displayName: true } },
          _count: { select: { attendees: true } }
        }
      })
    : [];

  res.render("groups/show", {
    user: req.user,
    group,
    member,
    posts,
    events
  });
});

/**
 * POST /groups/:id/join
 * - SECRET interdit
 */
groupsRouter.post("/:id/join", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.redirect("/groups");

  if (group.privacy === "SECRET") {
    return res.status(403).send("Invite only group");
  }

  await prisma.groupMember
    .create({
      data: {
        groupId,
        userId: req.user.id,
        role: "MEMBER"
      }
    })
    .catch(() => {});

  res.redirect(`/groups/${groupId}`);
});

/**
 * POST /groups/:id/leave
 */
groupsRouter.post("/:id/leave", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const member = await getMembership(groupId, req.user.id);
  if (!member || member.role === "OWNER") {
    return res.redirect(`/groups/${groupId}`);
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: req.user.id } }
  });

  res.redirect("/groups");
});

/**
 * POST /groups/:id/posts
 */
groupsRouter.post("/:id/posts", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  const content = (req.body?.content || "").trim();

  if (!Number.isFinite(groupId) || !content) {
    return res.redirect(`/groups/${groupId}`);
  }

  const member = await getMembership(groupId, req.user.id);
  if (!member) return res.status(403).send("Forbidden");

  await prisma.post.create({
    data: {
      content,
      authorId: req.user.id,
      groupId,
      visibility: "PUBLIC"
    }
  });

  res.redirect(`/groups/${groupId}`);
});
