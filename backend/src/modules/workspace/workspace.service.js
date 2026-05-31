import db from "../../database/db.js"

export const getUserWorkspaces = async (userId) => {
    const workspaces = await db`
        SELECT 
            o.id,
            o.name,
            o.slug,
            m.role,
            o.plan
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
        m.organization_id,
        o.plan as organization_plan
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
    const workspace = await db`
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

    return workspace[0]
}

export const updateWorkspace = async (orgId, updates) => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return null;

    const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

        const values = keys.map((key) => updates[key]);
        
        values.push(orgId);
    const idPlaceholder = `$${values.length}`;

    const result = await db.query(
        `UPDATE organizations
        SET ${setClause}
        WHERE id = ${idPlaceholder}
         RETURNING name, slug`,
        values
    );

    return result[0];
}

export const getWorkspaceMember = async (orgId, memberId) => {
    const member = await db`
        SELECT 
            u.id,
            u.name,
            u.email,
            u.profile_picture_resource_url,
            m.role
        FROM users u
        JOIN memberships m ON u.id = m.user_id
        JOIN organizations o ON o.id = m.organization_id
        WHERE o.id = ${orgId} AND u.id = ${memberId}
    `
        
    return member[0]
}

export const getWorkspaceMembers = async (orgId) => {
    const members = await db`
        SELECT 
            u.id,
            u.name,
            u.email,
            u.profile_picture_resource_url,
            m.role
        FROM users u
        JOIN memberships m ON u.id = m.user_id
        JOIN organizations o ON o.id = m.organization_id
        WHERE o.id = ${orgId}
    `
        
    return members
}

export const updateWorkspaceMemberRole = async (orgId, memberId, role) => {
    const member = await db`
        UPDATE memberships
        SET role = ${role}
        WHERE user_id = ${memberId}
        AND organization_id = ${orgId}
        RETURNING *;
    `
    return member[0]
}

export const deleteWorkspaceMember = async (memberId, orgId) => {
    await db`
        DELETE FROM memberships
        WHERE user_id = ${memberId}
        AND organization_id = ${orgId}
    `
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

export const getStats = async (orgId) => {
    const promises = await Promise.allSettled([
        await db`
            SELECT COUNT(*) as docs
            FROM documents
            WHERE organization_id = ${orgId}
        `,
        await db`
            SELECT COUNT(*) as connections
            FROM organization_connections
            WHERE organization_id = ${orgId}
            AND enabled = TRUE
        `,
        await db`
            SELECT COUNT(*) as members
            FROM memberships
            WHERE organization_id = ${orgId}
        `
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