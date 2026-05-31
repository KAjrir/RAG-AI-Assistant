import db from "../../database/db.js"

export const validateToken = async (token) => {
    const invitation = await db`
        SELECT 
            (u.email IS NOT NULL) AS user_exists,
            (i.expires_at > NOW()) AS valid
        FROM invitations i
        LEFT JOIN users u ON u.email = i.email
        WHERE i.token = ${token};
    `

    return invitation[0]
}

export const acceptInvite = async (invitationToken, userId) => {
    try {
        
        const [pendingInvite] = await db`
            SELECT 
                i.*
            FROM invitations i
            JOIN users u ON u.email = i.email
            WHERE i.token = ${invitationToken}
                AND u.id = ${userId}
                AND expires_at > NOW()
        `

        if (!pendingInvite) return {
            success: false,
            error: "No pending invite"
        }
        
        const orgId = pendingInvite.organization_id
        const role = pendingInvite.role
        const invited_by = pendingInvite.invited_by
        
        await db`BEGIN`

        await db`
            INSERT INTO memberships (user_id, organization_id, role, invited_by)
            VALUES (${userId}, ${orgId}, ${role}, ${invited_by})
        `
    
        await db`
            DELETE FROM invitations
            WHERE token = ${invitationToken}
            AND organization_id = ${orgId}
        `

        await db`COMMIT`

        const [workspace] = await db`
            SELECT
                name,
                slug,
                logo_resource_url
            FROM organizations
            WHERE id = ${orgId}
        `

        return {
            success: true,
            workspace: workspace
        }

    } catch (err) {
        console.error(err)
        await db`ROLLBACK`
        return {
            success: false
        }
    }
}

export const declineInvite = async (token) => {
    await db`
        DELETE FROM invitations
        WHERE token = ${token}
    `
}

export const getUserPendingInvites = async (userId) => {
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
            u.name as "invited_by",
            o.name as "org_name",
            o.slug as "org_slug",
            o.logo_resource_url
        FROM invitations i
        JOIN organizations o ON o.id = i.organization_id
        JOIN users u on u.id = i.invited_by
        WHERE i.email = ${userEmail}
        AND i.expires_at > NOW()
        AND i.status = 'pending'
    `

    return pendingInvites
}

export const inviteMembers = async (orgId, invitedBy, invitees) => {
    const invitations = await db`
        INSERT INTO invitations (organization_id, email, role, invited_by)
        SELECT * FROM unnest(
            ${invitees.map(() => orgId)}::uuid[],
            ${invitees.map(i => i.email)}::text[],
            ${invitees.map(i => i.role)}::text[],
            ${invitees.map(() => invitedBy)}::uuid[]
        )
        RETURNING *
    `
    return invitations

}

export const getInvite = async (inviteId) => {
    const invitation = await db`
        SELECT *
        FROM invitations
        WHERE id = ${inviteId}
    `

    return invitation[0]
}

export const getInvitationDetails = async (invitations) => {
    const invitationIds = invitations.map(i => i.id);

    const details = await db`
        SELECT
            i.id,
            u.name as user_name,
            o.name as org_name,
            o.logo_resource_url,
            i.role,
            i.email,
            i.token,
            i.expires_at
        FROM invitations i
        JOIN organizations o ON o.id = i.organization_id
        JOIN users u ON u.id = i.invited_by
        WHERE i.id = ANY(${invitationIds}::uuid[]);
    `

    return details
}

export const revokeInvite = async (orgId, inviteId) => {
    await db`
        DELETE FROM invitations
        WHERE id = ${inviteId}
        AND organization_id = ${orgId}
    `
}

export const getWorkspacePendingInvites = async (orgId) => {
    const invites = await db`
        SELECT *
        FROM invitations
        WHERE organization_id = ${orgId}
        AND status = 'pending'
    `

    return invites
}

export const getAllWorkspaceInvites = async (orgId) => {
    const invites = await db`
        SELECT *
        FROM invitations
        WHERE organization_id = ${orgId}
    `

    return invites
}
