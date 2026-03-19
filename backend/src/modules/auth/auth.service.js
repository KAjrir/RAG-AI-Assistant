import db from "../../database/db.js"

export const getUserId = async ({ email }) => {
    try {
        const user = await db`SELECT id FROM users WHERE email = ${email}`
        return user
    } catch (err) {
        console.error(err)
    }
}

export const getUserInfo = async ({ email }) => {
    try {
        const user = await db`SELECT id, password FROM users WHERE email = ${email}`
        return user
    } catch (err) {
        console.error(err)
    }
}

export const updateUserLogin = async (id) => {
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
            RETURNING id
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