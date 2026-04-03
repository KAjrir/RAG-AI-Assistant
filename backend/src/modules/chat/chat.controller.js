import { Router } from "express";
import { promptAI } from "../../ai-bot/vectorized_ai_chatbot.js";

import { getMessagesFromOrg, getChatsFromOrg, saveMessage, createChat, generateChatTitle, updateAssistantMessage, getChatId, deleteChat, updateChatTitle } from "./chat.service.js";
import { toJsonLine } from "../../utils.js";

const router = Router();


router.get("/", async (req, res) => {
  const userId = req.userId
  const orgId = req.orgId

  const chats = await getChatsFromOrg(userId, orgId) ?? []

  res.status(200).json(chats)
})

router.post("/", async (req, res) => {
  const orgId = req.orgId
  const userId = req.userId
  const userContent = req.body.message;  
  
  const [{ id }] = await createChat(orgId, userId);
  await saveMessage("user", userContent, id)
  
  generateChatTitle(userContent, id)
  const [assistantMessageId] = await saveMessage("assistant", "", id, "streaming")


  res.status(201).json({
    chatId: id,
    assistantMessageId: assistantMessageId.id
  })
})

router.get("/:chatId", async (req, res) => {
  const userId = req.userId
  const orgId = req.orgId
  const chatId = req.params.chatId


  const chat = await getChatId(chatId)
  if (chat.length < 1) return res.status(404).json({ message: "Chat not found"})
  
  const messages = await getMessagesFromOrg(userId, chatId)

  res.status(200).json(messages)
})

router.patch("/:chatId", async (req, res) => {
  const chatId = req.params.chatId
  const newTitle = req.body.title
  const { title } = await updateChatTitle(chatId, newTitle)

  res.status(200).json({title})
})

router.delete("/:chatId", async (req, res) => {
  const chatId = req.params.chatId
  await deleteChat(chatId)

  res.status(204).end()
})

router.post("/:chatId/messages", async (req, res) => {
  const userContent = req.body.message
  const userId = req.userId
  const orgId = req.orgId
  const chatId = req.params.chatId

  await saveMessage("user", userContent, chatId)
  const [assistantMessageId] = await saveMessage("assistant", "", chatId)

  res.status(201).json({assistantMessageId: assistantMessageId.id})
})

router.post("/messages", async (req, res) => {
  const userContent = req.body.message || "";
  const sessionId = req.body.session_id || "";
  let chatId = req.body.chatId
  const assistantId = req.body.assistantId
  const userId = req.userId
  const orgId = req.orgId
  const slug = req.slug



  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let assistantContent = "";
    const stream = await promptAI(userContent, sessionId, orgId);

    for await (const token of stream) {
        assistantContent += token.content
        res.write(toJsonLine(token))
    }
    
    await updateAssistantMessage(assistantId, assistantContent, "done")
    res.write(toJsonLine({
      event: "done",
    }))
    
  } catch (err) {
    console.error("Stream error:", err);
    return res.status(500).json({ message: "Server Error, probeer later opnieuw."})
  }
  res.end();
});

export default router