import db from "../../database/db.js"

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