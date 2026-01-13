import express from "express";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { obtenirCompteurNotifications } from "../notifications/notifications.service.js";
import { creerNotification } from "../notifications/notifications.service.js";

export const routesGroupes = express.Router();

//////////
// Obtient l'adhésion d'un utilisateur à un groupe
// Retourne: row GroupMember ou null
//////////
async function obtenirAdhesion(idGroupe, idUtilisateur) {
  return queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [idGroupe, idUtilisateur]
  );
}

//////////
// Affiche tous les groupes disponibles (PUBLIC uniquement hors adhésions)
// Affiche aussi les adhésions existantes de l'utilisateur
// Retourne: view groups/index
//////////
routesGroupes.get("/", exigerAuthentification, async (requete, reponse) => {
  const idUtilisateur = requete.user.id;

  const groupes = await query(`
    SELECT
      g.*,
      u.id as owner_id,
      u.displayName as owner_displayName,
      (SELECT COUNT(*) FROM GroupMember WHERE groupId = g.id) as members_count
    FROM \`Group\` g
    LEFT JOIN User u ON g.ownerId = u.id
    WHERE
      g.privacy = 'PUBLIC'
      AND NOT EXISTS (
        SELECT 1 FROM GroupMember WHERE groupId = g.id AND userId = ?
      )
    ORDER BY g.createdAt DESC
    LIMIT 50
  `, [idUtilisateur]);

  const donneesGroupes = groupes.map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    privacy: g.privacy,
    ownerId: g.ownerId,
    createdAt: g.createdAt,
    owner: { id: g.owner_id, displayName: g.owner_displayName },
    _count: { members: g.members_count }
  }));

  const mesAdhesions = await query(`
    SELECT gm.*, g.id as group_id, g.name as group_name, g.description as group_description,
           g.privacy as group_privacy, g.ownerId as group_ownerId, g.createdAt as group_createdAt
    FROM GroupMember gm
    JOIN \`Group\` g ON gm.groupId = g.id
    WHERE gm.userId = ?
  `, [idUtilisateur]);

  const donneesAdhesions = mesAdhesions.map(m => ({
    id: m.id, groupId: m.groupId, userId: m.userId, role: m.role, joinedAt: m.joinedAt,
    group: { id: m.group_id, name: m.group_name, description: m.group_description,
             privacy: m.group_privacy, ownerId: m.group_ownerId, createdAt: m.group_createdAt }
  }));

  reponse.render("groups/index", { user: requete.user, groups: donneesGroupes, myMemberships: donneesAdhesions });
});

//////////
// Crée un nouveau groupe
// L'auteur devient automatiquement propriétaire (OWNER)
// Privacy: PUBLIC | PRIVATE | SECRET
// Retourne: redirect /groups/:id
//////////
routesGroupes.post("/", exigerAuthentification, async (requete, reponse) => {
  const nom = (requete.body?.name || "").trim();
  const description = (requete.body?.description || "").trim();
  const privacy = String(requete.body?.privacy || "PUBLIC").toUpperCase();

  const privacyAutorisees = new Set(["PUBLIC", "PRIVATE", "SECRET"]);
  const privacySecurisee = privacyAutorisees.has(privacy) ? privacy : "PUBLIC";

  if (!nom) return reponse.redirect("/groups");

  const resultat = await query(
    "INSERT INTO \`Group\` (name, description, privacy, ownerId, createdAt) VALUES (?, ?, ?, ?, NOW())",
    [nom, description || null, privacySecurisee, requete.user.id]
  );

  const idGroupe = resultat.insertId;

  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'OWNER', NOW())",
    [idGroupe, requete.user.id]
  );

  reponse.redirect(`/groups/${idGroupe}`);
});

//////////
// Affiche un groupe en détail avec posts et événements
// Gère les accès: PRIVATE/SECRET requiert adhésion
// Retourne: view groups/show
//////////
routesGroupes.get("/:id", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.id);
  if (!Number.isFinite(idGroupe)) return reponse.redirect("/groups");

  const donneesGroupe = await queryOne(`
    SELECT g.*, u.id as owner_id, u.displayName as owner_displayName,
           (SELECT COUNT(*) FROM GroupMember WHERE groupId = g.id) as members_count
    FROM \`Group\` g
    LEFT JOIN User u ON g.ownerId = u.id
    WHERE g.id = ?
  `, [idGroupe]);

  if (!donneesGroupe) return reponse.redirect("/groups");

  const groupe = {
    id: donneesGroupe.id, name: donneesGroupe.name, description: donneesGroupe.description,
    privacy: donneesGroupe.privacy, ownerId: donneesGroupe.ownerId, createdAt: donneesGroupe.createdAt,
    owner: { id: donneesGroupe.owner_id, displayName: donneesGroupe.owner_displayName },
    _count: { members: donneesGroupe.members_count }
  };

  const adhesion = await obtenirAdhesion(idGroupe, requete.user.id);

  if ((groupe.privacy === "PRIVATE" || groupe.privacy === "SECRET") && !adhesion) {
    return reponse.redirect("/groups");
  }

  const jetonInvitation = requete.query.inviteToken ? String(requete.query.inviteToken) : undefined;

  let publications = [];
  if (adhesion) {
    const donneesPublications = await query(`
      SELECT p.*, u.id as author_id, u.displayName as author_displayName,
             (SELECT COUNT(*) FROM \`Like\` WHERE postId = p.id) as likes_count,
             (SELECT COUNT(*) FROM Comment WHERE postId = p.id) as comments_count
      FROM Post p
      LEFT JOIN User u ON p.authorId = u.id
      WHERE p.groupId = ?
      ORDER BY p.createdAt DESC
      LIMIT 50
    `, [idGroupe]);

    publications = donneesPublications.map(p => ({
      id: p.id, content: p.content, visibility: p.visibility, authorId: p.authorId,
      groupId: p.groupId, createdAt: p.createdAt,
      author: { id: p.author_id, displayName: p.author_displayName },
      likes: [], comments: [],
      _count: { likes: p.likes_count, comments: p.comments_count }
    }));
  }

  let evenements = [];
  if (adhesion) {
    const donnesEvenements = await query(`
      SELECT e.*, u.id as creator_id, u.displayName as creator_displayName
      FROM Event e
      LEFT JOIN User u ON e.creatorId = u.id
      WHERE e.groupId = ?
      ORDER BY e.startAt ASC
      LIMIT 30
    `, [idGroupe]);

    evenements = donnesEvenements.map(ev => ({
      id: ev.id, title: ev.title, location: ev.location, description: ev.description,
      startAt: ev.startAt, endAt: ev.endAt, groupId: ev.groupId, creatorId: ev.creatorId,
      createdAt: ev.createdAt, creator: { id: ev.creator_id, displayName: ev.creator_displayName },
      attendees: [], goingCount: 0, userRsvp: null, _count: { attendees: 0 }
    }));
  }

  const nonMembres = adhesion && (adhesion.role === "OWNER" || adhesion.role === "ADMIN")
    ? await query(`
        SELECT u.id, u.displayName, u.email FROM User u
        WHERE u.id != ? AND NOT EXISTS (SELECT 1 FROM GroupMember WHERE groupId = ? AND userId = u.id)
        ORDER BY u.displayName ASC LIMIT 20
      `, [requete.user.id, idGroupe])
    : [];

  const compteurNotifications = await obtenirCompteurNotifications(requete.user.id);

  reponse.render("groups/show", {
    user: requete.user, group: groupe, member: adhesion, posts: publications,
    events: evenements, inviteToken: jetonInvitation, unreadCount: compteurNotifications, nonMembers: nonMembres
  });
});

//////////
// Ajoute l'utilisateur actuel à un groupe
// Refusé pour les groupes SECRET (invite-only)
// Crée une notification au propriétaire
// Retourne: redirect /groups/:id
//////////
routesGroupes.post("/:id/join", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.id);
  if (!Number.isFinite(idGroupe)) return reponse.redirect("/groups");

  const groupe = await queryOne("SELECT * FROM \`Group\` WHERE id = ?", [idGroupe]);
  if (!groupe) return reponse.redirect("/groups");

  if (groupe.privacy === "SECRET") {
    return reponse.status(403).send("Invite only group");
  }

  await query(
    "INSERT INTO GroupMember (groupId, userId, role, joinedAt) VALUES (?, ?, 'MEMBER', NOW())",
    [idGroupe, requete.user.id]
  ).catch(() => {});

  await creerNotification({
    type: "GROUP_JOIN", toUserId: groupe.ownerId, fromUserId: requete.user.id
  });

  reponse.redirect(`/groups/${idGroupe}`);
});

//////////
// Supprime l'utilisateur d'un groupe
// Propriétaire ne peut pas quitter (simple)
// Retourne: redirect /groups
//////////
routesGroupes.post("/:id/leave", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.id);
  if (!Number.isFinite(idGroupe)) return reponse.redirect("/groups");

  const adhesion = await obtenirAdhesion(idGroupe, requete.user.id);
  if (!adhesion) return reponse.redirect(`/groups/${idGroupe}`);

  if (adhesion.role === "OWNER") return reponse.redirect(`/groups/${idGroupe}`);

  await query(
    "DELETE FROM GroupMember WHERE groupId = ? AND userId = ?",
    [idGroupe, requete.user.id]
  ).catch(() => {});

  reponse.redirect("/groups");
});

//////////
// Crée une publication dans un groupe
// Auteur doit être membre du groupe
// Visibility par défaut: PUBLIC
// Retourne: redirect /groups/:id
//////////
routesGroupes.post("/:id/posts", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.id);
  const contenu = (requete.body?.content || "").trim();

  if (!Number.isFinite(idGroupe)) return reponse.redirect("/groups");
  if (!contenu) return reponse.redirect(`/groups/${idGroupe}`);

  const adhesion = await obtenirAdhesion(idGroupe, requete.user.id);
  if (!adhesion) return reponse.status(403).send("Forbidden");

  await query(
    "INSERT INTO Post (content, authorId, groupId, visibility, createdAt) VALUES (?, ?, ?, 'PUBLIC', NOW())",
    [contenu, requete.user.id, idGroupe]
  );

  reponse.redirect(`/groups/${idGroupe}`);
});

//////////
// Crée un événement dans un groupe
// Valide: titre et startAt requis
// Envoie notifications GROUP_CREATED à tous les membres
// Retourne: redirect /groups/:id
//////////
routesGroupes.post("/:id/events", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.id);
  if (!Number.isFinite(idGroupe)) return reponse.redirect("/groups");

  const titre = (requete.body?.title || "").trim();
  const lieu = (requete.body?.location || "").trim();
  const description = (requete.body?.description || "").trim();
  const debutRaw = String(requete.body?.startAt || "");
  const finRaw = String(requete.body?.endAt || "");

  if (!titre || !debutRaw) return reponse.redirect(`/groups/${idGroupe}`);

  const adhesion = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [idGroupe, requete.user.id]
  );
  if (!adhesion) return reponse.status(403).send("Forbidden");

  const debut = new Date(debutRaw);
  const fin = finRaw ? new Date(finRaw) : null;

  if (Number.isNaN(debut.getTime())) return reponse.redirect(`/groups/${idGroupe}`);
  if (fin && Number.isNaN(fin.getTime())) return reponse.redirect(`/groups/${idGroupe}`);

  const resultat = await query(
    "INSERT INTO Event (title, location, description, startAt, endAt, groupId, creatorId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
    [titre, lieu || null, description || null, debut, fin, idGroupe, requete.user.id]
  );

  const idEvenement = resultat.insertId;

  const membres = await query(
    "SELECT userId FROM GroupMember WHERE groupId = ?",
    [idGroupe]
  );

  for (const m of membres) {
    if (m.userId === requete.user.id) continue;
    await creerNotification({
      type: "EVENT_CREATED", toUserId: m.userId, fromUserId: requete.user.id, eventId: idEvenement
    });
  }

  reponse.redirect(`/groups/${idGroupe}`);
});

//////////
// API: Retourne les événements d'un groupe au format JSON
// Gère les permissions (PUBLIC ou membre)
// Retourne: JSON array d'événements
//////////
routesGroupes.get("/:id/api/events", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.id);
  if (!Number.isFinite(idGroupe)) return reponse.json({ error: "Invalid group id" });

  try {
    const groupe = await queryOne("SELECT * FROM \`Group\` WHERE id = ?", [idGroupe]);
    if (!groupe) return reponse.json({ error: "Group not found" });

    const adhesion = await obtenirAdhesion(idGroupe, requete.user.id);
    if (!adhesion && groupe.privacy !== "PUBLIC") {
      return reponse.json({ error: "Access denied" });
    }

    const donnesEvenements = await query(`
      SELECT e.*, u.id as creator_id, u.displayName as creator_displayName
      FROM Event e
      LEFT JOIN User u ON e.creatorId = u.id
      WHERE e.groupId = ?
      ORDER BY e.startAt ASC
    `, [idGroupe]);

    const evenements = donnesEvenements.map(ev => ({
      id: ev.id, title: ev.title, location: ev.location, description: ev.description,
      startAt: ev.startAt, endAt: ev.endAt, groupId: ev.groupId, creatorId: ev.creatorId,
      createdAt: ev.createdAt, creator: { id: ev.creator_id, displayName: ev.creator_displayName },
      attendees: [], goingCount: 0, userRsvp: null
    }));

    reponse.json(evenements);
  } catch (error) {
    console.error("Error fetching events:", error);
    reponse.json({ error: "Error fetching events" });
  }
});

//////////
// API: Retourne les statistiques d'un groupe
// Comptes: membres, événements, publications
// Retourne: JSON avec statistiques
//////////
routesGroupes.get("/:id/api/stats", exigerAuthentification, async (requete, reponse) => {
  const idGroupe = Number(requete.params.id);
  if (!Number.isFinite(idGroupe)) return reponse.json({ error: "Invalid group id" });

  try {
    const groupe = await queryOne("SELECT * FROM \`Group\` WHERE id = ?", [idGroupe]);
    if (!groupe) return reponse.json({ error: "Group not found" });

    const adhesion = await obtenirAdhesion(idGroupe, requete.user.id);
    if (!adhesion && groupe.privacy !== "PUBLIC") {
      return reponse.json({ error: "Access denied" });
    }

    const maintenant = new Date();
    const totalMembreResult = await queryOne("SELECT COUNT(*) as count FROM GroupMember WHERE groupId = ?", [idGroupe]);
    const compteurEvenementResult = await queryOne("SELECT COUNT(*) as count FROM Event WHERE groupId = ?", [idGroupe]);
    const evenementsAveniResult = await queryOne("SELECT COUNT(*) as count FROM Event WHERE groupId = ? AND startAt >= ?", [idGroupe, maintenant]);
    const totalPublicationResult = await queryOne("SELECT COUNT(*) as count FROM Post WHERE groupId = ?", [idGroupe]);

    reponse.json({
      totalMembers: totalMembreResult?.count || 0,
      eventCount: compteurEvenementResult?.count || 0,
      upcomingEvents: evenementsAveniResult?.count || 0,
      totalPosts: totalPublicationResult?.count || 0
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    reponse.json({ error: "Error fetching stats" });
  }
});







