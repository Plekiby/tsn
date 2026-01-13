import express from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { addClient, removeClient } from "./sse.js";

export const realtimeRouter = express.Router();

// GET /events
realtimeRouter.get("/events", requireAuth, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(req.user.id, res);

  // heartbeat (évite timeout proxies)
  const ping = setInterval(() => {
    res.write("event: ping\ndata: {}\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    removeClient(req.user.id, res);
  });
});
