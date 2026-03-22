import { Router } from "express";
import { mockChats } from "../mocks/chat.mock.js";

import {} from "./chat.service.js";

const router = Router();

router.get("/", async (req, res) => {
    console.log(mockChats)
    res.status(200).json(mockChats)
})

router.get("/:id", async (req, res) => {
  const id = req.params.id
  const data = mockChats.filter(c => c.id === id)
  res.status(200).json(...data)
})

export default router