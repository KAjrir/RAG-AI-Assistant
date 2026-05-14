import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import { Router } from "express";
import multer from "multer";

import { promptAI } from "../../ai-bot/vectorized_ai_chatbot.js";
import { cache } from "../../cache.js"

import { getChatMessages, getChatsFromOrg, saveMessage, createChat, generateChatTitle, updateAssistantMessage, getChatId, deleteChat, updateChatTitle, getToolsForChat } from "./chat.service.js";
import { toJsonLine, getUuid } from "../../utils.js";
import { openaiToolFormat } from "../../ai-bot/refactorCode.js";
import { assetsPath, uploadsDirectory } from "../../constants.js";

const chatsFileDirectory = `${uploadsDirectory}/chat-resources`
const chatsFileResourcePath = `${assetsPath}/chat-resources`

await fs.mkdir(chatsFileDirectory, {recursive: true})

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, chatsFileDirectory);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${getUuid()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: multer.memoryStorage()
  // limits: {
  //   fileSize: 2 * 1024 * 1024, // 2MB
  // },
  // fileFilter(req, file, cb) {
  //   const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  //   if (!allowed.includes(file.mimetype)) {
  //     return cb(new Error('Alleen JPG, PNG of WebP is toegestaan.'));
  //   }
  //   cb(null, true);
  // }
});

const router = Router();


router.get("/", async (req, res) => {
  const userId = req.userId
  const orgId = req.orgId

  const chats = await getChatsFromOrg(userId, orgId) ?? []

  res.status(200).json(chats)
})

router.post("/", upload.array("files"), async (req, res) => {
  const orgId = req.orgId
  const userId = req.userId

  const { id } = await createChat(orgId, userId);

  for (const file of req.files) {
    if(file.mimetype.includes("image/")) {
      const filename = `${getUuid()}.webp`;
      const filepath = `${chatsFileDirectory}/${filename}`
      
      const optimized = 
        await sharp(file.buffer)
          .resize({ width: 1200, height: 1200, withoutEnlargement: true })
          .webp({ quality: 75 }).toFile(filepath);

      delete file.buffer
      file.filename = filename
      file.path = filepath
      file.size = optimized.size
      
    } else {

      const extname = path.extname(file.originalname)
      const filename = `${getUuid()}${extname}`;
      const filepath = `${chatsFileDirectory}/${filename}`
      await fs.writeFile(filepath, file.buffer)

      delete file.buffer
      file.filename = filename
      file.path = filepath
    }
  }
  
  const userContent = [
    ...req.files.map(f => (
      f.mimetype.includes("image") ? {
        type: "image",
        filepath: f.path,
        url: `${chatsFileResourcePath}/${f.filename}`,
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        chatId: id,
        size: f.size
      } : {
        type: "file",
        filepath: f.path,
        url: `${chatsFileResourcePath}/${f.filename}`,
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        chatId: id,
        size: f.size
      }
    )),

    ...(req.body.message ? [{
      type: "text",
      text: req.body.message
    }] : [])
  ]

  // console.log(userContent)
  const assistantContent = [
    {
      type: "text",
      text: ""
    }
  ]

  await saveMessage("user", userContent, id)
  
  generateChatTitle(req.body.message, id)
  const assistantMessage = await saveMessage("assistant", assistantContent, id, "streaming")


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

  const publicMessages = messages.map(msg => ({
    ...msg,
    content: msg.content.map(c => {
      if(c.type === "file" || c.type === "image") {
        return {
          type: c.type,
          originalname: c.originalname,
          url: c.url
        }
      } else {
        return c
      }
    })
  }))

  res.status(200).json(publicMessages)
})

router.patch("/:chatId", async (req, res) => {
  const chatId = req.params.chatId
  const newTitle = req.body.title
  const { title } = await updateChatTitle(chatId, newTitle)

  res.status(200).json({ title })
})

router.delete("/:chatId", async (req, res) => {
  const chatId = req.params.chatId
  await deleteChat(chatId)

  res.status(204).end()
})

[
  {
    fieldname: 'files',
    originalname: 'Feedback for HERKANSING Professional Skills Portfolio eerste 100-dagen.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 59093,

    filename: 'd42c15e7-5f6c-4506-8866-a95d17e490ac.pdf',
    path: '/home/kajrir/repos/RAG-AI-Assistant/backend/src/uploads/chat-resources/d42c15e7-5f6c-4506-8866-a95d17e490ac.pdf',
  },
  {
    fieldname: 'files',
    originalname: 'handtekening.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 13678,

    buffer: "<Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 01 90 00 00 00 c8 08 06 00 00 00 c6 15 b7 e2 00 00 10 00 49 44 41 54 78 01 ec dd 05 bc 6d 41 5d ... 13628 more bytes>",
  }
]


router.post("/:chatId/messages", upload.array("files"), async (req, res) => {
  const userId = req.userId
  const orgId = req.orgId
  const chatId = req.params.chatId
  
  for (const file of req.files) {
    if(file.mimetype.includes("image/")) {
      const filename = `${getUuid()}.webp`;
      const filepath = `${chatsFileDirectory}/${filename}`
      
      const optimized = 
        await sharp(file.buffer)
          .resize({ width: 1200, height: 1200, withoutEnlargement: true })
          .webp({ quality: 75 }).toFile(filepath);

      delete file.buffer
      file.filename = filename
      file.path = filepath
      file.size = optimized.size

    } else {

      const extname = path.extname(file.originalname)
      const filename = `${getUuid()}${extname}`;
      const filepath = `${chatsFileDirectory}/${filename}`
      await fs.writeFile(filepath, file.buffer)

      delete file.buffer
      file.filename = filename
      file.path = filepath
    }
  }

  console.log(req.files)

  const userContent = [
    ...req.files.map(f => (
      f.mimetype.includes("image") ? {
        type: "image",
        filepath: f.path,
        url: `${chatsFileResourcePath}/${f.filename}`,
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        chatId: chatId,
        size: f.size
      } : {
        type: "file",
        filepath: f.path,
        url: `${chatsFileResourcePath}/${f.filename}`,
        filename: f.filename,
        originalname: f.originalname,
        mimetype: f.mimetype,
        chatId: chatId,
        size: f.size
      }
    )),
    
    ...(req.body.message ? [{
      type: "text",
      text: req.body.message
    }] : [])
  ]

  const assistantContent = [
    {
      type: "text",
      text: ""
    }
  ]


  const userMessage = await saveMessage("user", userContent, chatId)
  const assistantMessage = await saveMessage("assistant", assistantContent, chatId)

  const history = JSON.parse(cache.get(`chat:${chatId}:messages`))
  
  if (history) {
    history.push(userMessage)
    history.push(assistantMessage)
    cache.set(`chat:${chatId}:messages`, JSON.stringify(history))
  }

  res.status(201).json({ assistantMessageId: assistantMessage.id })
})

router.post("/messages", async (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  const chatId = req.body.chatId
  const assistantId = req.body.assistantId
  
  const orgId = req.orgId
  const { model, connections } = req.body.payload

  const availableTools = await getToolsForChat(orgId, connections)
  // console.dir(availableTools, { depth: null })

  const tools = openaiToolFormat(availableTools)
  // console.dir(tools, {depth: null})
  
  let history = JSON.parse(cache.get(`chat:${chatId}:messages`))
  
  if(!history) {
    history = await getChatMessages(chatId)
    cache.set(`chat:${chatId}:messages`, JSON.stringify(history))
  }
  
  const userInput = {
    model,
    tools
  }

  try {
    let assistantText = "";
    const stream = await promptAI(userInput, history, orgId);

    for await (const token of stream) {
      assistantText += token.content
      res.write(toJsonLine(token))
    }

    const assistantContent = [
      {
        type: "text",
        text: assistantText
      }
    ]
    
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