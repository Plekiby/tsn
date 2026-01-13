import express from "express";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { query, queryOne } from "../db.js";
import { creerNotification } from "../notifications/notifications.service.js";

export const routesEvenements = express.Router();

//////////
// Enregistre la participation à un événement (GOING ou DECLINED)
// Vérifie que l'utilisateur est membre du groupe contenant l'événement
// Upsert l'état de participation (create ou update)
// Envoie une notification au créateur de l'événement
// Retourne: JSON {success, goingCount, status} ou redirect /groups/:id
//////////
routesEvenements.post("/:id/rsvp", exigerAuthentification, async (requete, reponse) => {
  const idEvenement = Number(requete.params.id);
  const statut = String(requete.body?.status || "GOING").toUpperCase();

  const statutsAutorises = new Set(["GOING", "DECLINED"]);
  const statutSecurise = statutsAutorises.has(statut) ? statut : "GOING";

  if (!Number.isFinite(idEvenement)) return reponse.redirect("/posts/feed");

  const evenement = await queryOne(
    "SELECT id, groupId, creatorId FROM Event WHERE id = ?",
    [idEvenement]
  );
  if (!evenement) return reponse.redirect("/posts/feed");

  const membre = await queryOne(
    "SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?",
    [evenement.groupId, requete.user.id]
  );
  if (!membre) return reponse.status(403).send("Forbidden");

  const existant = await queryOne(
    "SELECT * FROM EventAttendee WHERE eventId = ? AND userId = ?",
    [idEvenement, requete.user.id]
  );

  if (existant) {
    await query(
      "UPDATE EventAttendee SET status = ? WHERE eventId = ? AND userId = ?",
      [statutSecurise, idEvenement, requete.user.id]
    );
  } else {
    await query(
      "INSERT INTO EventAttendee (eventId, userId, status) VALUES (?, ?, ?)",
      [idEvenement, requete.user.id, statutSecurise]
    );
  }

  const resultCompteur = await queryOne(
    "SELECT COUNT(*) as count FROM EventAttendee WHERE eventId = ? AND status = 'GOING'",
    [idEvenement]
  );
  const compteurGoing = resultCompteur ? resultCompteur.count : 0;

  if (evenement.creatorId !== requete.user.id) {
    await creerNotification({
      type: "EVENT_RSVP",
      toUserId: evenement.creatorId,
      fromUserId: requete.user.id,
      eventId: evenement.id
    });
  }

  if (requete.headers['x-requested-with'] === 'XMLHttpRequest') {
    return reponse.json({ success: true, goingCount: compteurGoing, status: statutSecurise });
  }

  reponse.redirect(`/groups/${evenement.groupId}`);
});






