import db from "../../database/db.js"
import OpenAI from "openai"

const openai = new OpenAI();


export const getDoc = async (docId, orgId, ISPROD) => {
    const docs = await db`
        SELECT *
        FROM documents
        WHERE organization_id = ${orgId} and id = ${docId} and isprod = ${ISPROD}
    `

    return docs[0]
}

export const getDocs = async (orgId, limit, ISPROD) => {
    const docs = await db`
        SELECT id, originalname, resource_url, status, uploaded_by, uploaded_at, page_count, size
        FROM documents
        WHERE organization_id = ${orgId} AND isprod = ${ISPROD}
        ORDER BY
          CASE status
            WHEN 'processing'  THEN 1
            WHEN 'queued'      THEN 2
            WHEN 'uploading'   THEN 3
            WHEN 'failed'      THEN 4
            WHEN 'completed'   THEN 5
          END,
          uploaded_at DESC
        LIMIT ${limit}
    `

    return docs
}

export const addDocs = async (files) => {
    const docs = await db`
        INSERT INTO documents (id, organization_id, uploaded_by, originalname, size, resource_url, filepath, isprod, document_hash)
        SELECT * FROM unnest(
            ${files.map(f => f.docId)}::uuid[],
            ${files.map(f => f.organizationId)}::uuid[],
            ${files.map(f => f.uploadedBy)}::uuid[],
            ${files.map(f => f.originalName)}::text[],
            ${files.map(f => f.size)}::int[],
            ${files.map(f => f.resource_url)}::text[],
            ${files.map(f => f.filepath)}::text[],
            ${files.map(f => f.isprod)}::boolean[],
            ${files.map(f => f.documentHash)}::text[]
        )
        RETURNING *
    `;
    return docs
}

export const deleteDoc = async (orgId, docId) => {
    const deletedDoc = await db`
        DELETE FROM documents
        WHERE organization_id = ${orgId} and id = ${docId}
        RETURNING id, filepath
    `

    return deletedDoc
}

export const getDocStatus = async (docId, orgId) => {
    const [docStatus] = await db`
        SELECT status
        FROM documents
        WHERE id = ${docId} and organization_id = ${orgId}
    `

    return docStatus
}

export const getDocChunks = async (docId, orgId) => {
    const chunks = await db`
        SELECT chunk_index, content, created_at
        FROM document_chunks
        WHERE organization_id = ${orgId} and document_id = ${docId}
    `
    return chunks
}





// processDocument.js

export const updateDocStatus = async (documentId, status) => {
    await db`
      UPDATE documents 
      SET status = ${status}
      WHERE id = ${documentId}
    `
}

export const updateDocMetadata = async (documentId, pageCount) => {
    await db`
        UPDATE documents 
        SET page_count = ${pageCount}
        WHERE id = ${documentId}
    `
}

export const generateEmbedding = async (chunk) => {
    if(!chunk || !chunk.content) {
        return null
    }

    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.content,
    })
    // console.log(JSON.stringify(embedding, null, 2))

    return embedding
}

export const getDocumentChunks = async (documentId, organizationId) => {
    const documentChunks = await db`
        SELECT *
        FROM document_chunks
        WHERE document_id = ${documentId} and organization_id = ${organizationId}
    `

    return documentChunks
}

export const deleteDocumentChunks = async (documentId, organizationId) => {
    await db`
        DELETE FROM document_chunks
        WHERE document_id = ${documentId} and organization_id = ${organizationId}
    `
}

export const insertDocumentChunks = async (chunks) => {
    await db`
        INSERT INTO document_chunks (
            document_id,
            organization_id,
            chunk_index,
            content,
            embedding,
            metadata
        )
        SELECT * FROM unnest(
            ${chunks.map(c => c.documentId)}::uuid[],
            ${chunks.map(c => c.organizationId)}::uuid[],
            ${chunks.map(c => c.chunk_index)}::int[],
            ${chunks.map(c => c.content)}::text[],
            ${chunks.map(c => JSON.stringify(c.embedding))}::vector[],
            ${chunks.map(c => JSON.stringify(c.metadata))}::jsonb[]
        )
    `
}