import fs from "fs/promises"
import { Router } from "express";
import multer from "multer";

import { getDoc, getDocs, addDocs, deleteDoc, getDocStatus, getDocChunks } from "./doc.service.js";
import { processDocument } from "../jobs/processDocument.js";

import db from "../../database/db.js";
import myStorage from "./MyStorageEngine.js";


const router = Router();

router.get("/", async (req, res) => {
    const { limit } = req.query
    const orgId = req.orgId

    if (limit && isNaN(Number(limit))) {
        return res.status(400).json( { message: "Limit not specified" })
    }

    const docs = await getDocs(orgId, limit)

    res.status(200).json(docs)
})

router.post("/", (req, res) => {
    myStorage.array("files")(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({ error: "Bestand is te groot"})
            }
        } else if (err) {
        // An unknown error occurred when uploading.
            console.error(err)
            return res.status(500).json({ error: "Internal Server Error"})
        }

        // Everything went fine.
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
            const resource_url = file.resource_url
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
                documentHash: hash
            })
        }
    
        const docs = await addDocs(files)
        const publicDocs = [];
    
        for (const doc of docs) {
            const {document_hash, filepath, tokens, organization_id, ...restDoc} = doc
            publicDocs.push(restDoc)
        }
    
        for (const file of files) {
            processDocument(file.docId, file.organizationId, file.filepath, file.originalName)
        }
    
        res.status(200).json(publicDocs)
    })
})



router.get("/:docId", async (req, res) => {
    const { docId } = req.params;
    const orgId = req.orgId


    const { filepath, uploaded_by, ...restDoc} = await getDoc(docId, orgId)
    
    res.status(200).json(restDoc)
})

router.delete("/:docId", async (req, res) => {
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

router.post("/:docId/reindex", async (req, res) => {
    const { docId } = req.params;
    const orgId = req.orgId

    const { filepath, originalname } = await getDoc(docId, orgId)

    processDocument(docId, orgId, filepath, originalname)
    
    res.status(204).end()
})

router.get("/:docId/chunks", async (req, res) => {
    const { docId } = req.params
    const orgId = req.orgId

    const chunks = await getDocChunks(docId, orgId)
    
    res.status(200).json(chunks)
})

router.get("/:docId/status", async (req, res) => {
    const { docId } = req.params;
    const orgId = req.orgId
    
    const status = await getDocStatus(docId, orgId);

    res.status(200).json( status)
})


export default router;