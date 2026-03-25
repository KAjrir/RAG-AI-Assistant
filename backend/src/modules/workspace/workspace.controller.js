import { Router } from "express";

import { getUserWorkspaces, getCurrentWorkspace, getWorkspaceMembers } from "./workspace.service.js";

const router = Router();

router.get("/", async (req, res) => {
    const workspaces = await getUserWorkspaces(req.user.id)

    const sortedWorkspaces = workspaces.sort((a, b) => {
        if (a.role === "owner" && b.role !== "owner") return -1;
        if (a.role !== "owner" && b.role === "owner") return 1;
        return 0;
    });
    res.status(200).json(sortedWorkspaces)
})

router.get("/:slug", async (req, res) => {
    const { slug } = req.params;
    const { id: userId } = req.user

    const [workspace] = await getCurrentWorkspace(slug, userId)
    
    res.status(200).json(workspace)
})

router.get("/:slug/members", async (req, res) => {
    const { slug } = req.params;

    const members = await getWorkspaceMembers(slug)
    res.status(200).json(members)
})



router.get("/:slug/id", async (req, res) => {
    const memberships = await getUserWorkspaces(req.user.id)
    res.status(200).json(memberships)
})

router.patch("/:slug/id", async (req, res) => {
    const memberships = await getUserWorkspaces(req.user.id)
    res.status(200).json(memberships)
})

router.post("/:slug/invites", async (req, res) => {
    const memberships = await getUserWorkspaces(req.user.id)
    res.status(200).json(memberships)
})

router.delete("/:slug/members/:memberId", async (req, res) => {
    const memberships = await getUserWorkspaces(req.user.id)
    res.status(200).json(memberships)
})

export default router;