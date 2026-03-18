import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { promptAI } from "./vectorized_ai_chatbot.js";
import dotenv from "dotenv";

import { mockChats } from "./constants/mockdata.js";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL;
console.log(FRONTEND_URL);
console.log(mockChats)

const app = express();

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Globale limiter: 60 per minuut
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Route-specifieke limiter: 10 per minuut
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/chats", async (req, res) => {
  res.status(200).json(mockChats)
})

app.get("/api/chats/:id", async (req, res) => {
  const id = req.params.id
  const data = mockChats.filter(c => c.id === id)
  res.status(200).json(...data)
})

app.get("/api/chat-stream", chatLimiter, async (req, res) => {
  const message = req.query.message || "";
  const sessionId = req.query.session_id || "";

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // await sleep(8000)
    const stream = await promptAI(message, sessionId);
    for await (const token of stream) {
        res.write(token)
    }
  } catch (err) {
    console.error("Stream error:", err);
  } finally {
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

const sleep = ms => new Promise(r => setTimeout(r, ms))