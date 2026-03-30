import { Router } from "express";
import { promptAI } from "../../ai-bot/vectorized_ai_chatbot.js";

import { mockChats } from "../mocks/chat.mock.js";

import { getMessagesFromOrg, getChatsFromOrg, saveMessage, createChat, generateChatTitle, updateAssistantMessage, getChatId } from "./chat.service.js";
import { toJsonLine } from "../../utils.js";
const router = Router();




router.get("/", async (req, res) => {
  const slug = req.slug
  const userId = req.user.id
  const orgs = req.orgs

  const foundOrg = orgs.find(org => org.slug === slug)
  if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })

  const chats = await getChatsFromOrg(userId, foundOrg.id) ?? []

  res.status(200).json(chats)
})

router.post("/", async (req, res) => {
  const slug = req.slug
  const orgs = req.orgs
  const userId = req.user.id
  const userContent = req.body.message;

  console.log(userContent, userId)

  const foundOrg = orgs.find(org => org.slug === slug)
  if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
  
  
  const [{ id }] = await createChat(foundOrg.id, userId);
  await saveMessage("user", userContent, id)
  generateChatTitle(userContent, id)
  const [assistantMessageId] = await saveMessage("assistant", "", id, "streaming")


  res.status(201).json({
    chatId: id,
    assistantMessageId: assistantMessageId.id
  })
})

router.get("/:chatId", async (req, res) => {
  const slug = req.slug
  const userId = req.user.id
  const orgs = req.orgs
  const chatId = req.params.chatId

  const foundOrg = orgs.find(org => org.slug === slug)
  if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
  const chat = await getChatId(chatId)
  console.log(chat)
  if (chat.length < 1) return res.status(404).json({ message: "Chat not found"})
  
  const messages = await getMessagesFromOrg(userId, chatId)

  res.status(200).json(messages)
})

router.post("/:chatId/messages", async (req, res) => {
  const userContent = req.body.message
  const slug = req.slug
  const userId = req.user.id
  const orgs = req.orgs
  const chatId = req.params.chatId

  const foundOrg = orgs.find(org => org.slug === slug)
  if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
  
  await saveMessage("user", userContent, chatId)
  const [assistantMessageId] = await saveMessage("assistant", "", chatId)

  res.status(201).json({assistantMessageId: assistantMessageId.id})
})

router.post("/messages", async (req, res) => {
  const userContent = req.body.message || "";
  const sessionId = req.body.session_id || "";
  let chatId = req.body.chatId
  const assistantId = req.body.assistantId
  const userId = req.user.id
  const orgs = req.orgs
  const slug = req.slug

  const foundOrg = orgs.find(org => org.slug === slug)
  if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let assistantContent = "";
    const stream = await promptAI(userContent, sessionId, foundOrg.id);

    for await (const token of stream) {
        assistantContent += token.content
        res.write(toJsonLine(token))
    }
    
    await updateAssistantMessage(assistantId, assistantContent,"done")
  } catch (err) {
    console.error("Stream error:", err);
    return res.status(500).json({ message: "Server Error, probeer later opnieuw."})
  }
  res.end();
});

export default router