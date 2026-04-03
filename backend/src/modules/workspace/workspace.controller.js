import fs from "fs/promises"

import { Router } from "express";

import chatRouter from "../chat/chat.controller.js"
import { getUserWorkspaces, getCurrentWorkspace, getWorkspaceMembers, getDocs, getDoc, addDocs, getStats, getDocStatus, getDocChunks, deleteDoc } from "./workspace.service.js";
import { processDocument } from "../jobs/processDocument.js";
import { mockConnections } from "../mocks/stats.mock.js";
import { assetsPath, uploadsDirectory, ISPROD } from "../../constants.js";

import db from "../../database/db.js";
import myStorage from "./MyStorageEngine.js";


const router = Router();

router.use("/chats", chatRouter)

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


router.get("/docs", async (req, res) => {
    const { limit } = req.query
    const orgId = req.orgId

    if (limit && isNaN(Number(limit))) {
        return res.status(400).json( { message: "Limit not specified" })
    }

    const docs = await getDocs(orgId, limit, ISPROD )

    res.status(200).json(docs)
})

router.post("/docs", myStorage.array("files"), async (req, res) => {
    const userId = req.userId
    const orgId = req.orgId

    console.log(req.files)
    
    const files = []
    for (const file of req.files) {
        const docId = file.filename.split(".")[0];
        const organizationId = orgId
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



router.get("/docs/:docId", async (req, res) => {
    const { docId } = req.params;
    const orgId = req.orgId


    const { filepath, uploaded_by, ...restDoc} = await getDoc(docId, orgId, ISPROD)
    
    res.status(200).json(restDoc)
})

router.delete("/docs/:docId", async (req, res) => {
    const { docId } = req.params
    const orgId = req.orgId
    
    try {
        await db`BEGIN`
        const [doc] = await deleteDoc(orgId, docId)
        
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

router.post("/docs/:docId/reindex", async (req, res) => {
    const { docId } = req.params;
    const orgId = req.orgId

    const { filepath, originalname } = await getDoc(docId, orgId, ISPROD)

    processDocument(docId, orgId, filepath, originalname)
    
    res.status(204).end()
})

router.get("/docs/:docId/chunks", async (req, res) => {
    const { docId } = req.params
    const orgId = req.orgId

    const chunks = await getDocChunks(docId, orgId)
    
    res.status(200).json(chunks)
})

router.get("/docs/:docId/status", async (req, res) => {
    const { docId } = req.params;
    const orgId = req.orgId
    
    const status = await getDocStatus(docId, orgId);

    res.status(200).json( status)
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