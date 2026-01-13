import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { getUnreadCount } from "../notifications/notifications.service.js";
import { createNotification } from "../notifications/notifications.service.js";

export const groupsRouter = express.Router();

async function getMembership(groupId, userId) {
  return queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [groupId, userId]
  );
}

/**
 * GET /groups
 * - PUBLIC: visible pour tous
 * - PRIVATE: visible seulement si membre
 * - SECRET: jamais visible si non-membre
 */
groupsRouter.get("/", requireAuth, async (req, res) => {
  const meId = req.user.id;

  // Récupérer les groupes visibles
  const groups = await query(`
    SELECT
      g.*,
      u.id as owner_id,
      u.displayName as owner_displayName,
      (SELECT COUNT(*) FROM GroupMember WHERE groupId = g.id) as members_count
    FROM \`Group\` g
    LEFT JOIN User u ON g.ownerId = u.id
    WHERE
      g.privacy = 'PUBLIC'
      OR (g.privacy = 'PRIVATE' AND EXISTS (
        SELECT 1 FROM GroupMember WHERE groupId = g.id AND userId = ?
      ))
    ORDER BY g.createdAt DESC
    LIMIT 50
  `, [meId]);

  // Transformer les données
  const groupsData = groups.map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    privacy: g.privacy,
    ownerId: g.ownerId,
    createdAt: g.createdAt,
    owner: {
      id: g.owner_id,
      displayName: g.owner_displayName
    },
    _count: {
      members: g.members_count
    }
  }));

  // Mes memberships
  const myMemberships = await query(`
    SELECT
      gm.*,
      g.id as group_id,
      g.name as group_name,
      g.description as group_description,
      g.privacy as group_privacy,
      g.ownerId as group_ownerId,
      g.createdAt as group_createdAt
    FROM GroupMember gm
    JOIN \`Group\` g ON gm.groupId = g.id
    WHERE gm.userId = ?
  `, [meId]);

  const myMembershipsData = myMemberships.map(m => ({
    id: m.id,
    groupId: m.groupId,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt,
    group: {
      id: m.group_id,
      name: m.group_name,
      description: m.group_description,
      privacy: m.group_privacy,
      ownerId: m.group_ownerId,
      createdAt: m.group_createdAt
    }
  }));

  res.render("groups/index", { user: req.user, groups: groupsData, myMemberships: myMembershipsData });
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

  const result = await query(
    "INSERT INTO `Group` (name, description, privacy, ownerId, createdAt) VALUES (?, ?, ?, ?, NOW())",
    [name, description || null, safePrivacy, req.user.id]
  );

  const groupId = result.insertId;

  // Ajouter l'owner comme membre
  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'OWNER', NOW())",
    [groupId, req.user.id]
  );

  res.redirect(`/groups/${groupId}`);
});

/**
 * GET /groups/:id
 * - PUBLIC: page visible (posts/events uniquement si membre)
 * - PRIVATE/SECRET: accès uniquement si membre
 */
groupsRouter.get("/:id", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const groupData = await queryOne(`
    SELECT
      g.*,
      u.id as owner_id,
      u.displayName as owner_displayName,
      (SELECT COUNT(*) FROM GroupMember WHERE groupId = g.id) as members_count
    FROM \`Group\` g
    LEFT JOIN User u ON g.ownerId = u.id
    WHERE g.id = ?
  `, [groupId]);

  if (!groupData) return res.redirect("/groups");

  const group = {
    id: groupData.id,
    name: groupData.name,
    description: groupData.description,
    privacy: groupData.privacy,
    ownerId: groupData.ownerId,
    createdAt: groupData.createdAt,
    owner: {
      id: groupData.owner_id,
      displayName: groupData.owner_displayName
    },
    _count: {
      members: groupData.members_count
    }
  };

  const member = await getMembership(groupId, req.user.id);

  // 🔒 access gate
  if ((group.privacy === "PRIVATE" || group.privacy === "SECRET") && !member) {
    return res.redirect("/groups");
  }

  // token affiché après génération (query param)
  const inviteToken = req.query.inviteToken ? String(req.query.inviteToken) : undefined;

  // posts/events visibles seulement si membre
  let posts = [];
  if (member) {
    const postsData = await query(`
      SELECT
        p.*,
        u.id as author_id,
        u.displayName as author_displayName,
        (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id) as likes_count,
        (SELECT COUNT(*) FROM Comment WHERE postId = p.id) as comments_count
      FROM Post p
      LEFT JOIN User u ON p.authorId = u.id
      WHERE p.groupId = ?
      ORDER BY p.createdAt DESC
      LIMIT 50
    `, [groupId]);

    // Récupérer les likes de chaque post
    const postIds = postsData.map(p => p.id);
    const likes = postIds.length > 0 ? await query(`
      SELECT postId, userId FROM \`Like\` WHERE postId IN (${postIds.map(() => '?').join(',')})
    `, postIds) : [];

    // Récupérer les 3 derniers commentaires de chaque post
    const comments = postIds.length > 0 ? await query(`
      SELECT
        c.*,
        u.id as user_id,
        u.displayName as user_displayName
      FROM Comment c
      JOIN User u ON c.userId = u.id
      WHERE c.postId IN (${postIds.map(() => '?').join(',')})
      ORDER BY c.createdAt DESC
    `, postIds) : [];

    posts = postsData.map(p => ({
      id: p.id,
      content: p.content,
      visibility: p.visibility,
      authorId: p.authorId,
      groupId: p.groupId,
      createdAt: p.createdAt,
      author: {
        id: p.author_id,
        displayName: p.author_displayName
      },
      likes: likes.filter(l => l.postId === p.id).map(l => ({ userId: l.userId })),
      comments: comments
        .filter(c => c.postId === p.id)
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          content: c.content,
          postId: c.postId,
          userId: c.userId,
          createdAt: c.createdAt,
          user: {
            id: c.user_id,
            displayName: c.user_displayName
          }
        })),
      _count: {
        likes: p.likes_count,
        comments: p.comments_count
      }
    }));
  }

  let events = [];
  if (member) {
    const rawEvents = await query(`
      SELECT
        e.*,
        u.id as creator_id,
        u.displayName as creator_displayName
      FROM Event e
      LEFT JOIN User u ON e.creatorId = u.id
      WHERE e.groupId = ?
      ORDER BY e.startAt ASC
      LIMIT 30
    `, [groupId]);

    const eventIds = rawEvents.map(e => e.id);
    const attendees = eventIds.length > 0 ? await query(`
      SELECT eventId, userId, status FROM EventAttendee WHERE eventId IN (${eventIds.map(() => '?').join(',')})
    `, eventIds) : [];

    events = rawEvents.map(ev => {
      const evAttendees = attendees.filter(a => a.eventId === ev.id);
      return {
        id: ev.id,
        title: ev.title,
        location: ev.location,
        description: ev.description,
        startAt: ev.startAt,
        endAt: ev.endAt,
        groupId: ev.groupId,
        creatorId: ev.creatorId,
        createdAt: ev.createdAt,
        creator: {
          id: ev.creator_id,
          displayName: ev.creator_displayName
        },
        attendees: evAttendees,
        goingCount: evAttendees.filter(a => a.status === 'GOING').length,
        userRsvp: evAttendees.find(a => a.userId === req.user.id)?.status || null,
        _count: { attendees: evAttendees.length }
      };
    });
  }

  // Utilisateurs non-membres (pour invitations directes)
  const nonMembers = member && (member.role === "OWNER" || member.role === "ADMIN")
    ? await query(`
        SELECT u.id, u.displayName, u.email
        FROM User u
        WHERE u.id != ?
          AND NOT EXISTS (SELECT 1 FROM GroupMember WHERE groupId = ? AND userId = u.id)
          AND NOT EXISTS (SELECT 1 FROM GroupInvite WHERE groupId = ? AND toUserId = u.id)
        ORDER BY u.displayName ASC
        LIMIT 20
      `, [req.user.id, groupId, groupId])
    : [];

    const unreadCount = await getUnreadCount(req.user.id);

  res.render("groups/show", {
    user: req.user,
    group,
    member,
    posts,
    events,
    inviteToken,
    unreadCount,
    nonMembers
  });
});

/**
 * POST /groups/:id/join
 * - interdit si SECRET (invite only)
 */
groupsRouter.post("/:id/join", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) return res.redirect("/groups");

  const group = await queryOne("SELECT * FROM `Group` WHERE id = ?", [groupId]);
  if (!group) return res.redirect("/groups");

  if (group.privacy === "SECRET") {
    return res.status(403).send("Invite only group");
  }

  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'MEMBER', NOW())",
    [groupId, req.user.id]
  ).catch(() => {});

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

  await query(
    "DELETE FROM GroupMember WHERE groupId = ? AND userId = ?",
    [groupId, req.user.id]
  ).catch(() => {});

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

  await query(
    "INSERT INTO Post (content, authorId, groupId, visibility, createdAt) VALUES (?, ?, ?, 'PUBLIC', NOW())",
    [content, req.user.id, groupId]
  );

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

  const member = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [groupId, req.user.id]
  );
  if (!member) return res.status(403).send("Forbidden");

  const startAt = new Date(startAtRaw);
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  if (Number.isNaN(startAt.getTime())) return res.redirect(`/groups/${groupId}`);
  if (endAt && Number.isNaN(endAt.getTime())) return res.redirect(`/groups/${groupId}`);

  const result = await query(
    "INSERT INTO Event (title, location, description, startAt, endAt, groupId, creatorId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
    [title, location || null, description || null, startAt, endAt, groupId, req.user.id]
  );

  const eventId = result.insertId;

  // 🔔 Notif EVENT_CREATED à tous les membres du groupe (sauf créateur)
  const members = await query(
    "SELECT userId FROM GroupMember WHERE groupId = ?",
    [groupId]
  );

  for (const m of members) {
    if (m.userId === req.user.id) continue;

    await createNotification({
      type: "EVENT_CREATED",
      toUserId: m.userId,
      fromUserId: req.user.id,
      eventId: eventId
    });
  }

  res.redirect(`/groups/${groupId}`);
});

/**
 * GET /groups/:id/api/events
 * Retourne les événements du groupe au format JSON
 */
groupsRouter.get("/:id/api/events", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) {
    return res.json({ error: "Invalid group ID" });
  }

  try {
    const group = await queryOne("SELECT * FROM `Group` WHERE id = ?", [groupId]);

    if (!group) {
      return res.json({ error: "Group not found" });
    }

    const member = await getMembership(groupId, req.user.id);
    if (!member && group.privacy !== "PUBLIC") {
      return res.json({ error: "Access denied" });
    }

    const rawEvents = await query(`
      SELECT
        e.*,
        u.id as creator_id,
        u.displayName as creator_displayName
      FROM Event e
      LEFT JOIN User u ON e.creatorId = u.id
      WHERE e.groupId = ?
      ORDER BY e.startAt ASC
    `, [groupId]);

    const eventIds = rawEvents.map(e => e.id);
    const attendees = eventIds.length > 0 ? await query(`
      SELECT eventId, userId, status FROM EventAttendee WHERE eventId IN (${eventIds.map(() => '?').join(',')})
    `, eventIds) : [];

    const events = rawEvents.map(ev => {
      const evAttendees = attendees.filter(a => a.eventId === ev.id);
      return {
        id: ev.id,
        title: ev.title,
        location: ev.location,
        description: ev.description,
        startAt: ev.startAt,
        endAt: ev.endAt,
        groupId: ev.groupId,
        creatorId: ev.creatorId,
        createdAt: ev.createdAt,
        creator: {
          id: ev.creator_id,
          displayName: ev.creator_displayName
        },
        attendees: evAttendees,
        goingCount: evAttendees.filter(a => a.status === 'GOING').length,
        userRsvp: evAttendees.find(a => a.userId === req.user.id)?.status || null
      };
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.json({ error: "Error fetching events" });
  }
});

/**
 * GET /groups/:id/api/stats
 * Retourne les statistiques du groupe
 */
groupsRouter.get("/:id/api/stats", requireAuth, async (req, res) => {
  const groupId = Number(req.params.id);
  if (!Number.isFinite(groupId)) {
    return res.json({ error: "Invalid group ID" });
  }

  try {
    const group = await queryOne("SELECT * FROM `Group` WHERE id = ?", [groupId]);

    if (!group) {
      return res.json({ error: "Group not found" });
    }

    const member = await getMembership(groupId, req.user.id);
    if (!member && group.privacy !== "PUBLIC") {
      return res.json({ error: "Access denied" });
    }

    const now = new Date();

    const totalMembersResult = await queryOne("SELECT COUNT(*) as count FROM GroupMember WHERE groupId = ?", [groupId]);
    const eventCountResult = await queryOne("SELECT COUNT(*) as count FROM Event WHERE groupId = ?", [groupId]);
    const upcomingEventsResult = await queryOne("SELECT COUNT(*) as count FROM Event WHERE groupId = ? AND startAt >= ?", [groupId, now]);
    const totalPostsResult = await queryOne("SELECT COUNT(*) as count FROM Post WHERE groupId = ?", [groupId]);

    res.json({
      totalMembers: totalMembersResult?.count || 0,
      eventCount: eventCountResult?.count || 0,
      upcomingEvents: upcomingEventsResult?.count || 0,
      totalPosts: totalPostsResult?.count || 0
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.json({ error: "Error fetching stats" });
  }
});

