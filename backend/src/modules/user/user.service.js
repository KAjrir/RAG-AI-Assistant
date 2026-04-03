import db from "../../database/db.js"

export const findUserMemberships = async (userId) => {
    const memberships = await db`
        SELECT o.id, o.name, o.slug, m.role, o.plan
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = ${userId}
    `
    return memberships
}

export const updateOnboardingStatus = async (userId, status) => {
    await db`
        UPDATE users
        SET onboarding_completed = ${status}
        WHERE id = ${userId}
    `
}

export const createOrg = async (name, slug, userId) => {
    await db`
        INSERT INTO organizations (name, slug, created_by)
        VALUES (${name}, ${slug}, ${userId})
        RETURN id
    `
}

export const joinOrg = async (orgId) => {
    await db`
        INSERT INTO memberships ()
        VALUES ()
    `
}

export const getPendingInvites = async () => {
    
}