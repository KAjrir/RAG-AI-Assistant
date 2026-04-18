import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { Router } from "express";

import chatRouter from "../chat/chat.controller.js"
import docRouter from "../doc/doc.controller.js"

import { getCurrentWorkspace, getWorkspaceMembers, getStats, inviteMember, getAllInvites, getPendingInvites, deleteMember, updateWorkspaceName, checkOrgLogo, updateOrgLogo } from "./workspace.service.js";
import { assetsPath, ISPROD, uploadsDirectory } from "../../constants.js";
import { mockConnections } from "../mocks/stats.mock.js";


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

router.use("/chats", chatRouter)
router.use("/docs", docRouter)

router.get("/", async (req, res) => {
    const userId = req.userId
    const orgId = req.orgId;

    const [workspace] = await getCurrentWorkspace(orgId, userId)
    
    res.status(200).json(workspace)
})



router.patch("/", async (req, res) => {
    const orgId = req.orgId
    const { name } = req.body

    await updateWorkspaceName(orgId, name)

    res.status(201).json()
})

router.get("/members", async (req, res) => {
    const orgId = req.orgId

    const members = await getWorkspaceMembers(orgId)
    res.status(200).json(members)
})

router.post("/logo", upload.single('logo'), async (req, res) => {
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
})

router.delete('/logo', async (req, res) => {
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
});


router.get("/invites", async (req, res) => {
    const orgId = req.orgId
    const { all } = req.query
    let invites

    if (all && all === "true") {
        invites = await getAllInvites(orgId)
    } else if (all === undefined){
        invites = await getPendingInvites(orgId)
    } else {
        return res.status(400).json({ error: "Bad request"})
    }

    res.status(200).json({
        invites
    })
})

router.post("/invites", async (req, res) => {
    const userId = req.userId
    const orgId = req.orgId
    const { email, role } = req.body;


    const invitation = await inviteMember(orgId, email, role, userId)

    res.status(200).json(invitation)
})

router.delete("/invites/:id", async (req, res) => {
    const { email, role } = req.body;

    

    res.status(200).json()
})

router.delete("/members/:memberId", async (req, res) => {
    const { memberId } = req.params
    const orgId = req.orgId
    
    await deleteMember(memberId, orgId)
    res.status(200).json({ success: true })
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