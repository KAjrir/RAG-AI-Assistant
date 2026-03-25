import db from "../../database/db.js"

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