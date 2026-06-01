import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { Router } from "express";

import chatRouter from "../chat/chat.controller.js"
import docRouter from "../doc/doc.controller.js"
import connectionRouter from "../connection/connection.controller.js"

import { getCurrentWorkspace, getWorkspaceMembers, getStats, deleteWorkspaceMember, checkOrgLogo, updateOrgLogo, updateWorkspace, updateWorkspaceMemberRole, getWorkspaceMember } from "./workspace.service.js";
import { assetsPath, uploadsDirectory } from "../../constants.js";
import { requireActiveSubscription, requireOwner, requirePolicy } from "../middleware.js";
import { memberPolicy } from "./workspace.policy.js";


const organizationLogoFileDirectory = `${uploadsDirectory}/organization-logos`
const organizationLogoResourcePath = `${assetsPath}/organization-logos`

await fs.mkdir(organizationLogoFileDirectory, {recursive: true})

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, organizationLogoFileDirectory);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${req.userId}-${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Alleen JPG, PNG of WebP is toegestaan.'));
    }
    cb(null, true);
  }
});

const router = Router();

router.use("/chats", requireActiveSubscription, chatRouter)
router.use("/docs", requireActiveSubscription, docRouter)
router.use("/connections", requireActiveSubscription, connectionRouter)

router.get("/", async (req, res) => {
    const userId = req.userId
    const orgId = req.orgId;

    const workspace = await getCurrentWorkspace(orgId, userId)
    
    res.status(200).json(workspace)
})

router.patch("/",
    requireOwner,
    async (req, res) => {
        const orgId = req.orgId
        const { name, slug } = req.body;

        if (!name?.trim() && !slug?.trim()) {
            return res.status(400).json({ error: 'Niets om bij te werken.' });
        }

        const updates = {};
        if (name?.trim())  updates.name = name.trim();
        if (slug?.trim())  updates.slug = slug.trim();

        const updated = await updateWorkspace(orgId, updates)

        res.status(200).json(updated);
    }
);

router.delete("/",
    requireOwner,
    async (req, res) => {
        res.status(503).json({ error: "Nog niet mogelijk om workspaces te verwijderen"})
    }
)

router.post("/logo", 
    requireOwner,
    upload.single('logo'),
    async (req, res) => {
        const orgId = req.orgId

        const filePath = req.file.path;
        const resourcePath = `${organizationLogoResourcePath}/${req.file.filename}`;
        
        try {
            const existing = await checkOrgLogo(orgId)
        
            if(existing?.logo_file_url) {
                await fs.unlink(existing.logo_file_url)
            }
        
            await updateOrgLogo(orgId, filePath, resourcePath)
            res.status(200).json({ url: resourcePath })
        } catch (err) {
            await fs.unlink(filePath)
            console.error(err)
            res.status(500).json({ error: "Server error"})
        }
    }
)

router.delete('/logo',
    requireOwner,
    async (req, res) => {
        const orgId = req.orgId

        try {
            const org = await checkOrgLogo(orgId)

            if (!org?.logo_file_url) {
                return res.status(404).json({ error: 'Geen profielfoto gevonden.' });
            }

            await fs.unlink(org.logo_file_url);

            await updateOrgLogo(orgId, null, null)

            res.json({ success: true });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

router.get("/members", async (req, res) => {
    const orgId = req.orgId

    const members = await getWorkspaceMembers(orgId)
    res.status(200).json(members)
})

router.use(requireActiveSubscription)

router.patch("/members/:memberId",
    requirePolicy(memberPolicy, "update", async (req) => {
        const member = await getWorkspaceMember(req.orgId, req.params.memberId)
        
        return {
            ...member,
            actorId: req.userId,
            newRole: req.body.role,
        }
    }),
    async (req, res) => {
        const orgId = req.orgId
        const memberId = req.params.memberId
        const newRole = req.body.role

        const member = await updateWorkspaceMemberRole(orgId, memberId, newRole)
        res.status(200).json({ newRole: member.role})
    }
)

router.delete("/members/:memberId",
    requirePolicy(memberPolicy, "update", async (req) => {
        const member = await getWorkspaceMember(req.orgId, req.params.memberId)
        
        return {
            ...member,
            actorId: req.userId
        }
    }),
    async (req, res) => {
        const orgId = req.orgId
        const memberId = req.params.memberId
        
        await deleteWorkspaceMember(memberId, orgId)
        res.status(200).json({ success: true })
    }
)

router.get("/stats", async (req, res) => {
    const orgId = req.orgId
    
    const stats = await getStats(orgId);

    res.status(200).json(stats)
})


export default router;