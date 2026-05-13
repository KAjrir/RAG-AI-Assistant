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


export const getWorkspaceMembers = async (orgId) => {
    const members = db`
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

export const getConnectionsForOrganization = async (orgId) => {
    const connections = await db`
        SELECT 
            c.id,
            c.key,
            c.name,
            c.description,
            c.auth_type,
            c.icon_url,
            c.status,
            c.auth_config,
            CASE 
                WHEN oc.id IS NOT NULL THEN
                json_build_object(
                    'id', oc.id,
                    'enabled', oc.enabled,
                    'connected_at', oc.connected_at
                )
                ELSE NULL
            END AS organization_connection
        FROM connections c
        LEFT JOIN organization_connections oc 
        ON c.id = oc.connection_id 
        AND oc.organization_id = ${orgId}
        WHERE c.status != 'inactive'
        ORDER BY
            CASE
                WHEN status = 'active' THEN 1
                WHEN status = 'coming_soon' THEN 2
                ELSE 3
            END;
    `

    return connections
}

export const enableOrgConnection = async (orgId, connectionId, config) => {
    const orgConnection = await db`
        INSERT INTO organization_connections 
            (organization_id, connection_id, config, enabled)
        VALUES (${orgId}, ${connectionId}, ${config}, true)
        ON CONFLICT (organization_id, connection_id) DO UPDATE SET
            enabled = true,
            updated_at = NOW()
        RETURNING *;
    `

    // updated_at = CASE 
    // WHEN organization_connections.enabled = false
    // THEN NOW() 
    // ELSE organization_connections.updated_at

    return orgConnection[0]
}

export const disableOrgConnection = async (orgId, orgConnectionId) => {
    await db`
        UPDATE organization_connections
        SET 
            enabled = false,
            updated_at = NOW()
        WHERE id = ${orgConnectionId}
        AND organization_id = ${orgId};
    `
}

export const deleteOrgConnection = async (orgId, orgConnectionId) => {
    await db`
        DELETE FROM organization_connections
        WHERE id = ${orgConnectionId}
        AND organization_id = ${orgId};
    `
}

export const updateOrgConnectionConfig = async (orgId, orgConnectionId, config) => {
    const updatedConnection = await db`
        UPDATE organization_connections
        SET 
            config = ${config},
            updated_at = NOW()
        WHERE id = ${orgConnectionId}
        AND organization_id = ${orgId}
        RETURNING *;
    `

    return updatedConnection[0]
}