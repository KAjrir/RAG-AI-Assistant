import { Router } from "express";
import { promptAI } from "../../ai-bot/vectorized_ai_chatbot.js";

import { mockChats } from "../mocks/chat.mock.js";

import { getMessagesFromOrg, getChatsFromOrg } from "./chat.service.js";

const router = Router();


router.post("/messages", async (req, res) => {
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
    res.status(500).json({ message: "Server Error, probeer later opnieuw."})
  } finally {
    res.end();
  }
});

router.get("/", async (req, res) => {
  const { id, orgs } = req.user
  const { currentOrg } = req.query
  console.log(req.user)

  if ( !orgs.includes(currentOrg)) {
    return res.status(403).json({ message: "Unauthorized"})
  }

  const chats = await getChatsFromOrg(id, currentOrg) ?? []

  res.status(200).json(chats)
})

// router.get("/:id", async (req, res) => {
//   const userId = req.user.id
//   const chatId = req.params.id

//   console.log(chatId)

//   const messages = await getMessagesFromOrg(userId, chatId) ?? []

//   res.status(200).json(messages)
// })

export default router