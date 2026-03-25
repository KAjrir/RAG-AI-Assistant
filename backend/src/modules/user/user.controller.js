import { Router } from "express";

import { findUserMemberships } from "./user.service.js";

const router = Router();

router.get("/memberships", async (req, res) => {
    const memberships = await findUserMemberships(req.user.id)
    res.status(200).json(memberships)
})

export default router;