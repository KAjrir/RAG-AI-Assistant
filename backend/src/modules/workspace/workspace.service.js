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

export const getCurrentMiddlewareWorkspace = async (userId, slug) => {
    const memberships = await db`
      SELECT
        m.role,
        m.organization_id
      FROM memberships m
      JOIN organizations o ON o.id = m.organization_id
      WHERE m.user_id   = ${userId}
      AND   o.slug      = ${slug}
    `
    // AND   m.status    = 'active'
    // AND   o.is_active = true
    return memberships[0]
}

export const getCurrentWorkspace = async (orgId, userId) => {
    const workspace = db`
        SELECT 
            m.organization_id,
            m.role,
            m.status,
            o.name,
            o.slug,
            o.logo_resource_url
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE o.id = ${orgId}
        AND m.user_id = ${userId}
    `

    return workspace
}

export const updateWorkspaceName = async (orgId, name) => {
    await db`
        UPDATE organizations
        SET name = ${name}
        WHERE id = ${orgId}
    `
}

export const getWorkspaceMembers = async (orgId) => {
    const members = db`
        SELECT u.id, u.name, u.email, u.profile_picture_resource_url, m.role
        FROM users u
        JOIN memberships m ON u.id = m.user_id
        JOIN organizations o ON o.id = m.organization_id
        WHERE o.id = ${orgId}
    `

    return members
}

export const checkOrgLogo = async (orgId) => {
    const orgLogo = await db`
        SELECT 
            logo_file_url, 
            logo_resource_url
        FROM organizations
        WHERE id = ${orgId}
    `

    return orgLogo[0]
}

export const updateOrgLogo = async (orgId, filePath, resourcePath) => {
    await db`
        UPDATE organizations
        SET 
            logo_file_url = ${filePath},
            logo_resource_url = ${resourcePath}
        WHERE id = ${orgId}
    `
}

export const getStats = async (orgId, ISPROD) => {
    const promises = await Promise.allSettled([
        await db`
            SELECT COUNT(*) as docs
            FROM documents
            WHERE organization_id = ${orgId} and isprod = ${ISPROD}
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

export const inviteMember = async (orgId, email, role, invitedBy) => {
    try {
        const invitation = await db`
            INSERT INTO invitations (organization_id, email, role, invited_by)
            VALUES (${orgId}, ${email}, ${role}, ${invitedBy})
            RETURNING *
        `
        console.log(invitation)

        return invitation[0]
    } catch (err) {
        console.error(err)
        return null
    }
}

export const deleteMember = async (memberId, orgId) => {
    await db`
        DELETE FROM memberships
        WHERE user_id = ${memberId}
        AND organization_id = ${orgId}
    `
}

export const getPendingInvites = async (orgId) => {
    const invites = await db`
        SELECT *
        FROM invitations
        WHERE organization_id = ${orgId}
        AND status = 'pending'
    `

    return invites
}

export const getAllInvites = async (orgId) => {
    const invites = await db`
        SELECT *
        FROM invitations
        WHERE organization_id = ${orgId}
    `

    return invites
}