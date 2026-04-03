import { Router } from "express";

import { createOrg, findUserMemberships, updateOnboardingStatus } from "./user.service.js";

const router = Router();

router.post("/create-org", async (req, res) => {
    const userId = req.userId
    const { name, slug } = req.body

    await createOrg(userId, name, slug)
    await updateOnboardingStatus(userId, true)

    res.status(201).json({ success: true })
})

router.post("/join-org", async (req, res) => {
    const userId = req.userId

    const memberships = await findUserMemberships(userId)
    res.status(201).json(memberships)
})

router.post("/invite-members", async (req, res) => {
    const userId = req.userId

    const memberships = await findUserMemberships(userId)
    res.status(201).json(memberships)
})

router.get("/pending-invites", async (req, res) => {
    const userId = req.userId

    const memberships = await findUserMemberships(userId)
    res.status(200).json(memberships)
})



export default router;