import db from "../../database/db.js"


export const updateName = async (newName, userId) => {
    await db`
        UPDATE users
        SET name = ${newName}
        WHERE id = ${userId}
    `
}

export const checkProfilePicture = async (userId) => {
    const profilePicture = await db`
        SELECT 
            profile_picture_file_url, 
            profile_picture_resource_url
        FROM users
        WHERE id = ${userId}
    `

    return profilePicture[0]
}

export const updateProfilePicture = async (userId, filePath, resourcePath) => {
    await db`
        UPDATE users
        SET 
            profile_picture_file_url = ${filePath},
            profile_picture_resource_url = ${resourcePath}
        WHERE id = ${userId}
    `
}

export const updateOnboardingStatus = async (userId, status) => {
    await db`
        UPDATE users
        SET onboarding_completed = TRUE
        WHERE id = ${userId}
    `
}

export const createOrg = async (orgName, slug, userId) => {
    await db`
        INSERT INTO organizations (name, slug, created_by)
        VALUES (${orgName}, ${slug}, ${userId})
        RETURNING id
    `
}

export const joinOrg = async (invitationToken, userId) => {
    try {
        await db`BEGIN`
    
        const [pendingInvite] = await db`
            SELECT *
            FROM invitations
            WHERE token = ${invitationToken}
        `
        const orgId = pendingInvite.organization_id
        const role = pendingInvite.role
    
        await db`
            INSERT INTO memberships (user_id, organization_id, role)
            VALUES (${userId}, ${orgId}, ${role})
        `
    
        await db`
            UPDATE invitations
            SET status = 'accepted'
            WHERE token = ${invitationToken}
        `
    
        await db`COMMIT`

    } catch (error) {
        await db`ROLLBACK`
    }
}

export const getPendingInvites = async (userId) => {
    const [user] = await db`
        SELECT *
        FROM users
        WHERE id = ${userId}
    `
    const userEmail = user.email

    const pendingInvites = await db`
        SELECT
            i.id,
            i.token,
            i.role,
            i.expires_at,
            o.name as "orgName",
            o.slug as "orgSlug"
        FROM invitations i
        JOIN organizations o ON o.id = i.organization_id
        WHERE i.email = ${userEmail}
        AND i.status = 'pending'
    `

    return pendingInvites
}

export const checkSlugAvailability = async (newSlug) => {
    const slug = await db`
        SELECT slug
        FROM organizations
        WHERE slug = ${newSlug}
    `

    return slug[0]
} 