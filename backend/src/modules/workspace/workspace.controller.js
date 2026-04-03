import fs from "fs/promises"

import { Router } from "express";

import chatRouter from "../chat/chat.controller.js"
import { getUserWorkspaces, getCurrentWorkspace, getWorkspaceMembers, getDocs, getDoc, addDocs, getStats, getDocStatus, getDocChunks, deleteDoc } from "./workspace.service.js";
import { processDocument } from "../jobs/processDocument.js";
import { mockStats, mockDocs, mockChunks, mockConnections } from "../mocks/stats.mock.js";
import { assetsPath, uploadsDirectory, ISPROD } from "../../constants.js";

import db from "../../database/db.js";
import myStorage from "./MyStorageEngine.js";


const router = Router();


const miniMiddleware = (req, res, next) => {
    req.slug = req.params.slug

    next()
}

router.use("/:slug/chats", miniMiddleware, chatRouter)



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

    res.status(200).json()
})

router.post("/:slug/invites", async (req, res) => {
    // Uitnodigen van mensen

    res.status(200).json()
})

router.delete("/:slug/members/:memberId", async (req, res) => {
    // Verwijderen van teamgenoot

    res.status(200).json()
})


router.get("/:slug/docs", async (req, res) => {
    const { limit } = req.query

    if (limit && isNaN(Number(limit))) {
        return res.status(400).json( { message: "Limit not specified" })
    }

    const { slug } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })

    const docs = await getDocs(foundOrg.id, limit, ISPROD )

    res.status(200).json(docs)
})

router.post("/:slug/docs", myStorage.array("files"), async (req, res) => {
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
        const hash = file.hash

        files.push({
            docId,
            organizationId,
            uploadedBy,
            originalName,
            size,
            resource_url,
            filepath,
            isprod: ISPROD,
            documentHash: hash
        })
    }

    const docs = await addDocs(files)
    const publicDocs = [];

    for (const doc of docs) {
        const {document_hash, filepath, isprod, tokens, organization_id, ...restDoc} = doc
        publicDocs.push(restDoc)
    }

    console.log("POST ROUTE ADDED DOCS: ", publicDocs)
    
    for (const file of files) {
        processDocument(file.docId, file.organizationId, file.filepath, file.originalName)
    }

    res.status(200).json(publicDocs)
})



router.get("/:slug/docs/:docId", async (req, res) => {
    const { slug, docId } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)

    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
    const { filepath, uploaded_by, ...restDoc} = await getDoc(docId, foundOrg.id, ISPROD)
    
    res.status(200).json(restDoc)
})

router.delete("/:slug/docs/:docId", async (req, res) => {
    const { slug, docId } = req.params
    const orgs = req.orgs
    
    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
    
    try {
        await db`BEGIN`
        const [doc] = await deleteDoc(foundOrg.id, docId)
        
        if(!doc){
            return res.status(404).json({ message: "Document Not Found"})
        }

        await fs.unlink(doc.filepath)
        await db`COMMIT`
        return res.status(200).json({id: doc.id})

    } catch (err) {
        console.error(err)
        await db`ROLLBACK`
        return res.status(500).json({ message: "Someting went wrong deleting the file" })
    }
})

router.post("/:slug/docs/:docId/reindex", async (req, res) => {
    const { slug, docId } = req.params;
    const orgs = req.orgs

    const foundOrg = orgs.find(org => org.slug === slug)
    if (!foundOrg) return res.status(403).json({ message: "Unauthorized" })
    const { filepath, originalname } = await getDoc(docId, foundOrg.id, ISPROD)

    processDocument(docId, foundOrg.id, filepath, originalname)
    
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
    
    const stats = await getStats(foundOrg.id, ISPROD);

    res.status(200).json(stats)
})

export default router;