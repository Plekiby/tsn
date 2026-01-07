import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../prisma.js";
import { getUnreadCount } from "../notifications/notifications.service.js";
import { createNotification } from "../notifications/notifications.service.js";

export const groupsRouter = express.Router();

async function getMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
}

/**
 * GET /groups
 * - PUBLIC: visible pour tous
 * - PRIVATE: visible seulement si membre
 * - SECRET: jamais visible si non-membre
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
        // SECRET: non listé si non membre
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      owner: { select: { id: true, displayName: true } },
      _count: { select: { members: true } }
    }
  });

  const myMemberships = await prisma.groupMember.findMany({
    where: { userId: meId },
    include: { group: true }
  });

  res.render("groups/index", { user: req.user, groups, myMemberships });
});

/**
 * POST /groups
 * Create group (OWNER auto member)
 */
groupsRouter.post("/", requireAuth, async (req, res) => {
  const name = (req.body?.name || "").trim();
  const description = (req.body?.description || "").trim();
  const privacy = String(req.body?.privacy || "PUBLIC").toUpperCase();

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
        create: { userId: req.user.id, role: "OWNER" }
      }
    }
  });

  res.redirect(`/groups/${group.id}`);
});

/**
 * GET /groups/:id
 * - PUBLIC: page visible (posts/events uniquement si membre)
 * - PRIVATE/SECRET: accès uniquement si membre
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

  // 🔒 access gate
  if ((group.privacy === "PRIVATE" || group.privacy === "SECRET") && !member) {
    return res.redirect("/groups");
  }

  // token affiché après génération (query param)
  const inviteToken = req.query.inviteToken ? String(req.query.inviteToken) : undefined;

  // posts/events visibles seulement si membre
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
            include: { user: { select: { id: true, displayName: true } } }
          },
          _count: { select: { likes: true, comments: true } }
        }
      })
    : [];

  const events = member
    ? await prisma.event.findMany({
        where: { groupId },
        orderBy: { startAt: "asc" },
        take: 30,
        include: {
          creator: { select: { id: true, displayName: true } },
          _count: { select: { attendees: true } }
        }
      })
    : [];

    const unreadCount = await getUnreadCount(req.user.id);

  res.render("groups/show", {
    user: req.user,
    group,
    member,
    posts,
    events,
    inviteToken,
    unreadCount
  });
});

/**
 * POST /groups/:id/join
 * - interdit si SECRET (invite only)
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
      data: { groupId, userId: req.user.id, role: "MEMBER" }
    })
    .catch(() => {});

  await createNotification({
    type: "GROUP_JOIN",
    toUserId: group.ownerId,     // notif owner
    fromUserId: req.user.id
  });

  res.redirect(`/groups/${groupId}`);
});

/**
 * POST /groups/:id/leave
 */
groupsRouter.post("/:id/leave", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const member = await getMembership(groupId, req.user.id);
  if (!member) return res.redirect(`/groups/${groupId}`);

  // owner ne leave pas (simple)
  if (member.role === "OWNER") return res.redirect(`/groups/${groupId}`);

  await prisma.groupMember
    .delete({ where: { groupId_userId: { groupId, userId: req.user.id } } })
    .catch(() => {});

  res.redirect("/groups");
});

/**
 * POST /groups/:id/posts
 */
groupsRouter.post("/:id/posts", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  const content = (req.body?.content || "").trim();

  if (!Number.isFinite(groupId)) return res.redirect("/groups");
  if (!content) return res.redirect(`/groups/${groupId}`);

  const member = await getMembership(groupId, req.user.id);
  if (!member) return res.status(403).send("Forbidden");

  await prisma.post.create({
    data: {
      content,
      authorId: req.user.id,
      groupId,
      // visibility pas vraiment utilisée pour groupe, on garde PUBLIC
      visibility: "PUBLIC"
    }
  });

  res.redirect(`/groups/${groupId}`);
});

/**
 * POST /groups/:id/events
 * Création event (membre only)
 */
groupsRouter.post("/:id/events", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const title = (req.body?.title || "").trim();
  const location = (req.body?.location || "").trim();
  const description = (req.body?.description || "").trim();
  const startAtRaw = String(req.body?.startAt || "");
  const endAtRaw = String(req.body?.endAt || "");

  if (!title || !startAtRaw) return res.redirect(`/groups/${groupId}`);

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } }
  });
  if (!member) return res.status(403).send("Forbidden");

  const startAt = new Date(startAtRaw);
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  if (Number.isNaN(startAt.getTime())) return res.redirect(`/groups/${groupId}`);
  if (endAt && Number.isNaN(endAt.getTime())) return res.redirect(`/groups/${groupId}`);

  const ev = await prisma.event.create({
    data: {
      title,
      location: location || null,
      description: description || null,
      startAt,
      endAt,
      groupId,
      creatorId: req.user.id
    }
  });

  // 🔔 Notif EVENT_CREATED à tous les membres du groupe (sauf créateur)
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true }
  });

  const notifData = members
    .filter(m => m.userId !== req.user.id)
    .map(m => ({
      type: "EVENT_CREATED",
      toUserId: m.userId,
      fromUserId: req.user.id,
      eventId: ev.id
    }));

  if (notifData.length > 0) {
    for (const m of members) {
      if (m.userId === req.user.id) continue;

      await createNotification({
        type: "EVENT_CREATED",
        toUserId: m.userId,
        fromUserId: req.user.id,
        eventId: ev.id
      });
    }
  }

  res.redirect(`/groups/${groupId}`);
});

