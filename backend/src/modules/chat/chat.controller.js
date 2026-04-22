import { Router } from "express";
import { promptAI } from "../../ai-bot/vectorized_ai_chatbot.js";
import { cache } from "../../cache.js"

import { getChatMessages, getChatsFromOrg, saveMessage, createChat, generateChatTitle, updateAssistantMessage, getChatId, deleteChat, updateChatTitle } from "./chat.service.js";
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
  
  const { id } = await createChat(orgId, userId);
  await saveMessage("user", userContent, id)
  
  generateChatTitle(userContent, id)
  const assistantMessage = await saveMessage("assistant", "", id, "streaming")


  res.status(201).json({
    chatId: id,
    assistantMessageId: assistantMessage.id
  })
})

router.get("/:chatId", async (req, res) => {
  const userId = req.userId
  const orgId = req.orgId
  const chatId = req.params.chatId


  const chat = await getChatId(chatId, userId, orgId)
  if (chat.length < 1) return res.status(404).json({ message: "Chat not found"})
  
  const messages = await getChatMessages(chatId)
  console.log(messages)

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

  const userMessage = await saveMessage("user", userContent, chatId)
  const assistantMessage = await saveMessage("assistant", "", chatId)

  const history = JSON.parse(cache.get(`chat:${chatId}:messages`))
  
  if (history) {
    history.push(userMessage)
    history.push(assistantMessage)
    cache.set(`chat:${chatId}:messages`, JSON.stringify(history))
  }

  res.status(201).json({assistantMessageId: assistantMessage.id})
})

router.post("/messages", async (req, res) => {
  const userContent = req.body.message || "";
  const chatId = req.body.chatId
  const assistantId = req.body.assistantId

  const userId = req.userId
  const orgId = req.orgId

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let history = JSON.parse(cache.get(`chat:${chatId}:messages`))
  
  if(!history) {
    history = await getChatMessages(chatId)
    cache.set(`chat:${chatId}:messages`, JSON.stringify(history))
  }

  try {
    let assistantContent = "";
    const stream = await promptAI(userContent, history, orgId);

    for await (const token of stream) {
        assistantContent += token.content
        res.write(toJsonLine(token))
    }
    
    const assistantMessage = await updateAssistantMessage(assistantId, assistantContent, "done")

    const indexAssistantMessage = history.findIndex(msg => msg.id === assistantMessage.id)
    history[indexAssistantMessage] = assistantMessage

    cache.set(`chat:${chatId}:messages`, JSON.stringify(history))

    res.write(toJsonLine({
      event: "done",
    }))

    // console.log(JSON.parse(cache.get(`chat:${chatId}:messages`)).slice(history.length - 5))
    res.end();
  } catch (err) {
    console.error("Stream error:", err);
    cache.delete(`chat:${chatId}:messages`);
    return res.status(500).json({ message: "Server Error, probeer later opnieuw."})
  }
});

export default router