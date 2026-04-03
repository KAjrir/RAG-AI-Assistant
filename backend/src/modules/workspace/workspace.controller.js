import { Router } from "express";

import chatRouter from "../chat/chat.controller.js"
import docRouter from "../doc/doc.controller.js"

import { getCurrentWorkspace, getWorkspaceMembers, getStats } from "./workspace.service.js";
import { ISPROD } from "../../constants.js";
import { mockConnections } from "../mocks/stats.mock.js";



const router = Router();

router.use("/chats", chatRouter)
router.use("/docs", docRouter)

router.get("/", async (req, res) => {
    const userId = req.userId
    const orgId = req.orgId;

    const [workspace] = await getCurrentWorkspace(orgId, userId)
    
    res.status(200).json(workspace)
})

router.get("/members", async (req, res) => {
    const orgId = req.orgId

    const members = await getWorkspaceMembers(orgId)
    res.status(200).json(members)
})


router.patch("/", async (req, res) => {
    // Update workspace naam

    res.status(200).json()
})

router.post("/invites", async (req, res) => {
    // Uitnodigen van mensen

    res.status(200).json()
})

router.delete("/members/:memberId", async (req, res) => {
    // Verwijderen van teamgenoot

    res.status(200).json()
})

router.get("/connections", async (req, res) => {

    res.status(200).json(mockConnections)
})

router.get("/stats", async (req, res) => {
    const orgId = req.orgId
    
    const stats = await getStats(orgId, ISPROD);

    res.status(200).json(stats)
})

export default router;