import fs from "fs/promises";
import path from "path";

import { Router } from "express";
import { requireActiveSubscription, requireAuth, requirePolicy, requireWorkspace } from "../middleware.js";

import { FRONTEND_URL, BACKEND_URL } from "../../constants.js";
import { formatDate } from "../../utils.js";
import sgMail from "../../mailer/mailer.js";


import { declineInvite, getAllWorkspaceInvites, getInvitationDetails, getUserPendingInvites, getWorkspacePendingInvites, inviteMembers, acceptInvite, revokeInvite, validateToken, getInvite } from "./invitation.service.js";
import { getWorkspaceMembers } from "../workspace/workspace.service.js";
import { updateOnboardingStatus } from "../user/user.service.js";
import { invitationPolicy } from "./invitation.policy.js";

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

router.get("/:slug/workspace/pending",
    requireAuth,
    requireWorkspace,
    requireActiveSubscription,
    async (req, res) => {
        const orgId = req.orgId
        const { all } = req.query
        let invites

        if (all && all === "true") {
            invites = await getAllWorkspaceInvites(orgId)
        } else if (all === undefined){
            invites = await getWorkspacePendingInvites(orgId)
        } else {
            return res.status(400).json({ error: "Bad request"})
        }

        res.status(200).json({
            invites
        })
    }
)

router.post("/:slug/create",
    requireAuth,
    requireWorkspace,
    requireActiveSubscription,
    requirePolicy(invitationPolicy, "create", (req) => ({
        invitees: req.body.invitees
    })),
    async (req, res) => {
        const userId = req.userId
        const orgId = req.orgId
        const invitees = req.body.invitees

        const wsMembers = await getWorkspaceMembers(orgId)

        const existing = wsMembers.some(wsMem => {
            return invitees.some(inv => inv.email === wsMem.email)
        })

        if(existing) {
            return res.status(400).json({
                error: "User al verbonden met organisatie"
            })
        }

        const invitations = await inviteMembers(orgId, userId, invitees)
        const invitationDetails = await getInvitationDetails(invitations)

        for (const inv of invitationDetails) {
            const organization_logo = `${BACKEND_URL}${inv.logo_resource_url}`
            const invitation_url = `${FRONTEND_URL}/uitnodiging?token=${inv.token}`
    
            const templateData = {
                organization_logo,
                organization_name: inv.org_name,
                invited_by_name: inv.user_name,
                role: inv.role,
                invitation_url,
                expires_at: formatDate(inv.expires_at)
            }
    
            const templatesDir = path.resolve(import.meta.dirname, "../../email-templates");
            const filePath = path.join(templatesDir, "invite-user.html");
            const emailTemplate = await fs.readFile(filePath, "utf8")
            
            const filledTemplate = emailTemplate.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
                return templateData[key] ?? ""
            })
    
            const msg = {
                to: inv.email, 
                from: process.env.EMAIL_USER, 
                subject: `Uitnodiging van ${inv.user_name} - ${inv.org_name}`,
                html: filledTemplate,
            }
    
            await sgMail.send(msg)
        }

        res.status(201).json(invitations)
    }
)

router.post("/:slug/workspace/revoke",
    requireAuth,
    requireWorkspace,
    requireActiveSubscription,
    requirePolicy(invitationPolicy, "revoke", async (req) => {
        const invitation = await getInvite(req.body.inviteId)
        return {
            invitedRole: invitation.role
        }
    }),
    async (req, res) => {
        const orgId = req.orgId
        const inviteId = req.body.inviteId

        await revokeInvite(orgId, inviteId)

        res.status(200).json()
    }
)

export default router