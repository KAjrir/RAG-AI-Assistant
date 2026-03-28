import db from "../../database/db.js"


export const getDocs = async (orgId) => {
    const docs = await db`
        SELECT filename, storage_path, status, created_at
        FROM documents
        WHERE organization_id = ${orgId}
    `

    return docs
}