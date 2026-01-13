import express from "express";
import { query, queryOne } from "../db.js";
import { exigerAuthentification } from "../auth/auth.middleware.js";

export const routesInterets = express.Router();

//////////
// Affiche tous les intérêts et gère les abonnements utilisateur
// Charge les intérêts existants et marque ceux de l'utilisateur
// Retourne: vue interests/index
//////////
routesInterets.get("/", exigerAuthentification, async (requete, reponse) => {
  const tousLesInterets = await query("SELECT * FROM Interest ORDER BY name ASC");

  const mesInterets = await query(`
    SELECT
      ui.*,
      i.id as interest_id,
      i.name as interest_name
    FROM UserInterest ui
    JOIN Interest i ON ui.interestId = i.id
    WHERE ui.userId = ?
  `, [requete.user.id]);

  const ensembleMesInterets = new Set(mesInterets.map(x => x.interestId));

  reponse.render("interests/index", {
    user: requete.user,
    interests: tousLesInterets,
    mySet: ensembleMesInterets
  });
});

//////////
// Crée un nouvel intérêt (admin)
// Insère dans la table Interest
// Retourne: redirect /interests
//////////
routesInterets.post("/", exigerAuthentification, async (requete, reponse) => {
  const nomInteret = (requete.body?.name || "").trim();
  if (!nomInteret) return reponse.redirect("/interests");

  await query("INSERT INTO Interest (name) VALUES (?)", [nomInteret]).catch(() => {});
  reponse.redirect("/interests");
});

//////////
// Active/désactive un intérêt pour l'utilisateur
// Insère ou supprime de UserInterest
// Retourne: redirect /interests
//////////
routesInterets.post("/:id/toggle", exigerAuthentification, async (requete, reponse) => {
  const idInteret = Number(requete.params.id);
  if (!Number.isFinite(idInteret)) return reponse.redirect("/interests");

  const existe = await queryOne(
    "SELECT * FROM UserInterest WHERE userId = ? AND interestId = ?",
    [requete.user.id, idInteret]
  );

  if (existe) {
    await query(
      "DELETE FROM UserInterest WHERE userId = ? AND interestId = ?",
      [requete.user.id, idInteret]
    ).catch(() => {});
  } else {
    await query(
      "INSERT INTO UserInterest (userId, interestId) VALUES (?, ?)",
      [requete.user.id, idInteret]
    ).catch(() => {});
  }

  reponse.redirect("/interests");
});






