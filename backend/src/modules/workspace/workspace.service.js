import db from "../../database/db.js"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getUserWorkspaces = async (userId) => {
    const workspaces = await db`
        SELECT o.id, o.name, o.slug, m.role, o.plan
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = ${userId}
    `
    return workspaces
}

export const getCurrentWorkspace = async (slug, userId) => {
    const workspace = db`
        SELECT m.organization_id, m.role, m.status, o.name, o.slug
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE o.slug = ${slug} and m.user_id = ${userId}
    `

    return workspace
}

export const getWorkspaceMembers = async (slug) => {
    const members = db`
        SELECT u.id, u.name, u.email, m.role
        FROM users u
        JOIN memberships m ON u.id = m.user_id
        JOIN organizations o ON o.id = m.organization_id
        WHERE o.slug = ${slug}
    `

    return members
}

export const getDoc = async (docId, orgId) => {
    const docs = await db`
        SELECT id, originalname, resource_url, status, uploaded_by, uploaded_at, size
        FROM documents
        WHERE organization_id = ${orgId} and id = ${docId}
    `

    return docs[0]
}

export const getDocs = async (orgId, limit) => {
    const docs = await db`
        SELECT id, originalname, resource_url, status, uploaded_by, uploaded_at, size
        FROM documents
        WHERE organization_id = ${orgId}
        ORDER BY
          CASE status
           WHEN 'failed' THEN 4
           WHEN 'processing' THEN 1
           WHEN 'completed' THEN 5
           WHEN 'uploading' THEN 3
           WHEN 'queued' THEN 2
          END,
          uploaded_at DESC
        LIMIT ${limit}
    `

    return docs
}

export const addDoc = async (files) => {
    const docs = await db`
        INSERT INTO documents (id, organization_id, uploaded_by, originalname, size, resource_url, filepath, isprod)
        SELECT * FROM unnest(
            ${files.map(f => f.docId)}::uuid[],
            ${files.map(f => f.organizationId)}::uuid[],
            ${files.map(f => f.uploadedBy)}::uuid[],
            ${files.map(f => f.originalName)}::text[],
            ${files.map(f => f.size)}::int[],
            ${files.map(f => f.resource_url)}::text[],
            ${files.map(f => f.filepath)}::text[],
            ${files.map(f => f.isprod)}::boolean[]
        )
        RETURNING id
    `;

    return docs.map(({ id }) => id)
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

export const getStats = async (orgId) => {
    const promises = await Promise.allSettled([
        await db`
            SELECT COUNT(*) as docs
            FROM documents
            WHERE organization_id = ${orgId}
        `,
        await db`
        SELECT COUNT(*) as members
        FROM memberships
        WHERE organization_id = ${orgId}
        `
        // const connections = await db``
    ])
    const stats = { docs: 0, connections: 0, members: 0 }

    for (const { status, value } of promises){
        const [promiseValue] = value
        if (status !== "fulfilled") continue

        for (const [key, value] of Object.entries(promiseValue)) {
            stats[key] = value
        }
    }
    
    return stats
}












// processDocument.js

export const updateDocStatus = async (documentId, status) => {
    await db`
      UPDATE documents SET status = ${status} WHERE id = ${documentId}
    `
}

export const generateEmbedding = async (chunk) => {
    if(!chunk || !chunk.content) {
        return null
    }

    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',  // goedkoopste, werkt prima voor RAG
        input: chunk.content,
    })

    return embedding
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