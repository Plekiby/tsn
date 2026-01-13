import express from "express";
import { exigerAuthentification } from "../auth/auth.middleware.js";
import { ajouterClient, retirerClient } from "./sse.js";

export const routesTempsReel = express.Router();

//////////
// Établit une connexion SSE (Server-Sent Events) temps réel
// Enregistre le client dans la liste des connexions actives
// Envoie un heartbeat toutes les 25 secondes pour éviter timeouts proxies
// Nettoie la connexion à la fermeture
// Retourne: flux SSE continu (text/event-stream)
//////////
routesTempsReel.get("/events", exigerAuthentification, (requete, reponse) => {
  reponse.setHeader("Content-Type", "text/event-stream");
  reponse.setHeader("Cache-Control", "no-cache");
  reponse.setHeader("Connection", "keep-alive");
  reponse.flushHeaders();

  ajouterClient(requete.user.id, reponse);

  const pulse = setInterval(() => {
    reponse.write("event: ping\ndata: {}\n\n");
  }, 25000);

  requete.on("close", () => {
    clearInterval(pulse);
    retirerClient(requete.user.id, reponse);
  });
});






