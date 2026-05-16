import fs from "fs/promises";
import path from "path";

import { Router } from "express";
import { requireAuth, requireWorkspace } from "../middleware.js";

import { FRONTEND_URL, BACKEND_URL } from "../../constants.js";
import { formatDate } from "../../utils.js";
import sgMail from "../../mailer/mailer.js";


import { declineInvite, getAllInvites, getInvitationDetails, getUserPendingInvites, getWorkspacePendingInvites, inviteMember, acceptInvite, revokeInvite, validateToken } from "./invitation.service.js";
import { getWorkspaceMembers } from "../workspace/workspace.service.js";
import { updateOnboardingStatus } from "../user/user.service.js";

const router = Router();


// ==========================================
// 1. OPENBARE / USER ROUTES (Geen slug nodig)
// ==========================================

router.get("/validate/:token", async (req, res) => {
    const token = req.params.token;

    if(!token) return res.status(400).json({ error: "Token not provided" });

    const invitation = await validateToken(token);

    return res.status(200).json(invitation);
})

router.post("/accept", requireAuth, async (req, res) => {
    const userId = req.userId
    const invitationToken = req.body.token

    const result = await acceptInvite(invitationToken, userId)

    if(!result.success) return res.status(404).json({ error: "Geen uitnodiging gevonden" });

    await updateOnboardingStatus(userId)

    res.status(200).json({ workspace: result.workspace, success: true })
})

router.post("/user/decline", requireAuth, async (req, res) => {
    const token = req.body.token
    await declineInvite(token)

    res.status(200).json()
})

router.get("/user/pending", requireAuth, async (req, res) => {
    const userId = req.userId
    const pendingInvites = await getUserPendingInvites(userId)

    res.status(200).json({ invites: pendingInvites })
})


// ==========================================
// 2. WORKSPACE / ADMIN ROUTES (Wel een slug nodig)
// ==========================================

router.get("/:slug/workspace/pending", requireAuth, requireWorkspace, async (req, res) => {
    const orgId = req.orgId
    const { all } = req.query
    let invites

    if (all && all === "true") {
        invites = await getAllInvites(orgId)
    } else if (all === undefined){
        invites = await getWorkspacePendingInvites(orgId)
    } else {
        return res.status(400).json({ error: "Bad request"})
    }

    res.status(200).json({
        invites
    })
})

router.post("/:slug/create", requireAuth, requireWorkspace, async (req, res) => {
    const userId = req.userId
    const orgId = req.orgId
    const { email, role } = req.body;

    const wsMembers = await getWorkspaceMembers(orgId)
    const existing = wsMembers.find(wsMem => wsMem.email === email)

    if(existing) {
        return res.status(400).json({
            error: "User al verbonden met organisatie"
        })
    }

    const invitation = await inviteMember(orgId, email, role, userId)
    const invitationDetails = await getInvitationDetails(invitation.id)

    const organization_logo = `${BACKEND_URL}${invitationDetails.logo_resource_url}`
    const invitation_url = `${FRONTEND_URL}/uitnodiging?token=${invitationDetails.token}`

    const templateData = {
        organization_logo,
        organization_name: invitationDetails.org_name,
        invited_by_name: invitationDetails.user_name,
        role: role,
        invitation_url,
        expires_at: formatDate(invitationDetails.expires_at)
    }

    console.log(templateData)
        
    const templatesDir = path.resolve(import.meta.dirname, "../../email-templates");
    const filePath = path.join(templatesDir, "invite-user.html");
    const emailTemplate = await fs.readFile(filePath, "utf8")
    
    const filledTemplate = emailTemplate.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return templateData[key] ?? ""
    })

    const msg = {
        to: email, 
        from: process.env.EMAIL_USER, 
        subject: `Uitnodiging van ${invitationDetails.user_name} - ${invitationDetails.org_name}`,
        html: filledTemplate,
    }

    await sgMail.send(msg)

    res.status(201).json(invitation)
})

router.post("/:slug/workspace/revoke", requireAuth, requireWorkspace, async (req, res) => {
    const orgId = req.orgId
    const inviteId = req.body.inviteId

    await revokeInvite(orgId, inviteId)

    res.status(200).json()
})

export default router