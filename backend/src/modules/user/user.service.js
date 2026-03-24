import db from "../../database/db.js"

export const findUserMemberships = async (userId) => {
    const memberships = await db`
        SELECT o.id, o.name, o.slug, m.role, o.plan
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = ${userId}
    `
    console.log(memberships)
    return memberships
}