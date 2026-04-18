import db from "../../database/db.js"

export const getUser = async ({ id, email }) => {
    try {
        if(id) {
            const user = await db`
                SELECT *
                FROM users 
                WHERE id = ${id}
            `
            return user[0]
        }
        
        if(email) {
            const user = await db`
                SELECT * 
                FROM users 
                WHERE email = ${email}
            `
            return user[0]
        }
    } catch (err) {
        console.error(err)
    }
}

export const getUserInfo = async ( userId ) => {
    try {
        const user = await db`
            SELECT
                u.id,
                u.name,
                u.email,
                u.onboarding_completed,
                u.profile_picture_resource_url,
                COALESCE(
                    json_agg(json_build_object(
                        'orgId', m.organization_id,
                        'orgName',        o.name,
                        'orgSlug',        o.slug,
                        'role',            m.role,
                        'logo_resource_url', o.logo_resource_url
                    )) FILTER (WHERE m.organization_id IS NOT NULL),
                    '[]'::json
                ) AS memberships
            FROM users u
            LEFT JOIN memberships m ON m.user_id = u.id
            LEFT JOIN organizations o ON o.id = m.organization_id
            WHERE u.id = ${userId}
            GROUP BY u.id
        `
        return user[0]
    } catch (err) {
        console.error(err)
    }
}

export const updateUserLastLogin = async (id) => {
    try {
        const user = await db`UPDATE users SET last_login_at = now() WHERE id = ${id}`
        return user
    } catch (err) {
        console.error(err)
    }
}


export const getInvitation = async (inviteToken) => {
    try {
        const invite = await db`
            SELECT * FROM invitations
            WHERE token = ${inviteToken}
            AND status = 'pending'
            and expires_at > now()
        `

        return invite

    } catch(err) {
        console.error(err)
    }
}

export const createUser = async (name, email, passwordHash, invitation) => {

    await db`BEGIN`
    try {
        const [user] = await db`
            INSERT INTO users (name, email, password)
            VALUES (${name}, ${email}, ${passwordHash})
            RETURNING id, name, email
        `
        if(invitation) {
            await db`
                INSERT INTO memberships (user_id, organization_id, role)
                VALUES (${user.id}, ${invitation.organization_id}, ${invitation.role})
            `
    
            await db`
                UPDATE invitations
                SET status = 'accepted'
                WHERE id = ${invitation.id}
            `
        }
        await db`COMMIT`

        return user
    } catch(err) {
        await db`ROLLBACK`
        throw err
    }
}

export const getOrgAndMembershipInfo = async (userId) => {
    const memberships = await db`
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
    return memberships
}

export const getOrgs = async (userId) => {
    const orgs = await db`
        SELECT 
        o.id, o.slug
        FROM organizations o
        JOIN memberships m ON o.id = m.organization_id
        WHERE m.user_id = ${userId}
    `

    // Antwoord komt terug in [{ id: }, { id: }]
    return orgs
}

export const createResetToken = async (hashedResetToken, userId) => {
    await db`
        DELETE FROM password_reset_tokens
        WHERE user_id = ${userId}
    `;

    await db`
        INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
        VALUES (${hashedResetToken}, ${userId}, NOW() + INTERVAL '15 minutes')
    `
}

export const getPasswordResetToken = async (hashedToken) => {
    const [resetToken] = await db`
        SELECT *
        FROM password_reset_tokens
        WHERE token_hash = ${hashedToken} AND expires_at > NOW();
    `
    return resetToken
}

export const updateUserPassword = async (userId, hashedPassword) => {
    await db`
        UPDATE users
        SET password = ${hashedPassword}
        WHERE id = ${userId}
    `

    await db`
        DELETE FROM password_reset_tokens
        WHERE user_id = ${userId}
    `;
} 