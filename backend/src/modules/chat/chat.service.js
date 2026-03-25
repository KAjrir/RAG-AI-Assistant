import db from "../../database/db.js"

export const getChatsFromOrg = async (userId, orgId) => {
    const chats = await db`
        SELECT id, title
        FROM chats
        WHERE organization_id = ${orgId} AND user_id = ${userId}
    `
    console.log(chats)
    return chats
}


export const getMessagesFromOrg = async (userId, chatId) => {

    // Hier moet nog extra checken komen of wel echt alleen van de chat messages zijn opgehaald

    const messages = db`
        SELECT id, role, content
        FROM messages
        WHERE chat_id = ${chatId}
    `

    return messages
}
