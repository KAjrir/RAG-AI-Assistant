import path from "path";
import { Router } from "express";
import multer, { diskStorage } from "multer";
import { randomUUID } from "crypto";

import { getUserWorkspaces, getCurrentWorkspace, getWorkspaceMembers, getDocs, getDoc, addDoc, getStats, getDocStatus, getDocChunks } from "./workspace.service.js";
import { processDocument } from "../jobs/processDocument.js";
import { mockStats, mockDocs, mockChunks, mockConnections } from "../mocks/stats.mock.js";
import { assetsPath, uploadsDirectory, ISPROD } from "../../server.js";

const router = Router();
const upload = multer({ 
    storage: diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDirectory)
        },
        filename: (req, file, cb) => {
            const uuid = randomUUID();
            const lastIndexPoint = file.originalname.lastIndexOf(".")
            const extname =  file.originalname.slice(lastIndexPoint)

            cb(null, `${uuid}${extname}`)
        }
    }),
    fileFilter: (req, file, cb) => {
        const fileTypes = /.pdf|.docx|.txt|.jpeg/
        const fileExt = path.extname(file.originalname).toLowerCase()
        file.ext = fileExt
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase())

        if(extname){
            return cb(null, true)
        } else {
            cb("ERRORRR")
        }

    }
})


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
    const userId = req.user.id
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })

    const [workspace] = await getCurrentWorkspace(slug, userId)
    
    res.status(200).json(workspace)
})

router.get("/:slug/members", async (req, res) => {
    const { slug } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })

    const members = await getWorkspaceMembers(slug)
    res.status(200).json(members)
})


router.patch("/:slug", async (req, res) => {
    // Update workspace naam

    res.status(200).json(memberships)
})

router.post("/:slug/invites", async (req, res) => {
    // Uitnodigen van mensen

    res.status(200).json(memberships)
})

router.delete("/:slug/members/:memberId", async (req, res) => {
    // Verwijderen van teamgenoot

    res.status(200).json(memberships)
})




//  ============ NOG GEBRUIK MAKEN VAN MOCKDATA ============


router.get("/:slug/docs", async (req, res) => {
    const { limit } = req.query

    if (limit && isNaN(Number(limit))) {
        return res.status(400).json( { message: "Limit not specified" })
    }

    const { slug } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })

    const docs = await getDocs(foundOrg.id, limit )

    res.status(200).json(docs)
    // res.status(200).json(mockDocs)
})

router.post("/:slug/docs", upload.array("files"), async (req, res) => {
    const { slug } = req.params
    const userId = req.user.id
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
    console.log(req.files)
    
    const files = []
    for (const file of req.files) {
        const docId = file.filename.split(".")[0];
        const organizationId = foundOrg.id
        const uploadedBy = userId;
        // const uploadedAt -- Deze per default bij db
        // const pageCount = -- hoeft nog niet
        // const tokens = -- hoeft nog niet
        // const chunks = -- Deze een trigger zetten op document_chunks
        const originalName = file.originalname
        const size = file.size
        const resource_url = `${assetsPath}/${file.filename}`
        const filepath = file.path
        // const status = -- Deze per default bij db

        files.push({
            docId,
            organizationId,
            uploadedBy,
            originalName,
            size,
            resource_url,
            filepath,
            isprod: ISPROD
        })
    }

    const ids = await addDoc(files)
    console.log(ids)
    
    for (const file of files) {
        processDocument(file.docId, file.organizationId, file.filepath, file.originalName)
    } 

    res.status(200).json(mockDocs)
})



router.get("/:slug/docs/:docId", async (req, res) => {
    const { slug, docId } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)

    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
    const doc = await getDoc(docId, foundOrg.id)
    
    res.status(200).json(doc)
})

router.delete("/:slug/docs/:docId", async (req, res) => {
    res.status(204).end()
})

router.get("/:slug/docs/:docId/chunks", async (req, res) => {
    const { slug, docId } = req.params
    const orgs = req.orgs
    
    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })

    const chunks = await getDocChunks(docId, foundOrg.id)
    
    res.status(200).json(chunks)
})

router.get("/:slug/docs/:docId/status", async (req, res) => {
    const { slug, docId } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
    
    const status = await getDocStatus(docId, foundOrg.id);

    res.status(200).json( status)
})

router.get("/:slug/connections", async (req, res) => {

    res.status(200).json(mockConnections)
})

router.get("/:slug/stats", async (req, res) => {
    const { slug } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
    
    const stats = await getStats(foundOrg.id);

    res.status(200).json(stats)
})

export default router;