import db from "../../database/db.js"
import OpenAI from "openai"

const openai = new OpenAI();

export const getChatId = async (chatId) => {
    const chat = await db`
        SELECT id, title
        FROM chats
        WHERE id = ${chatId}
    `
    return chat
}

export const getChatsFromOrg = async (userId, orgId) => {
    const chats = await db`
        SELECT id, title
        FROM chats
        WHERE organization_id = ${orgId} AND user_id = ${userId}
        ORDER BY updated_at DESC
    `
    return chats
}


export const getMessagesFromOrg = async (userId, chatId) => {
    const messages = await db`
        SELECT id, role, content, status
        FROM messages
        WHERE chat_id = ${chatId}
        ORDER BY created_at ASC
    `

    return messages
}

export const saveMessage = async (role, content, chatId, status = null) => {
    const messageId = await db`
        INSERT INTO messages (chat_id, role, content, status)
        VALUES (${chatId}, ${role}, ${content}, ${status})
        RETURNING id
    `

    return messageId
}

export const updateAssistantMessage = async (assistantMessageId, assistantContent, status) => {
    await db`
        UPDATE messages
        SET status = ${status}, content = ${assistantContent}
        WHERE id = ${assistantMessageId}
    `
}

export const createChat = async (orgId, userId) => {
    const chatId = await db`
        INSERT INTO chats (organization_id, user_id)
        VALUES (${orgId}, ${userId})
        RETURNING id
    `
    return chatId
}

export const generateChatTitle = async (userContent, chatId) => {
    const response = await openai.responses.create({
        model: "gpt-4o-mini",
        max_output_tokens: 16,
        instructions: "Give a neutral, short but descriptive title",
        input: `Short title (max 6 words):\n\n${userContent.slice(0,300)}`
    });

    await db`
        UPDATE chats
        SET title = ${response.output_text}
        WHERE id = ${chatId}
    `
}

export const deleteChat = async (chatId) => {
    await db`
        DELETE FROM chats
        WHERE id = ${chatId}
    `
}

export const updateChatTitle = async (chatId, title) => {
    const [newTitle] = await db`
        UPDATE chats
        SET title = ${title}
        WHERE id = ${chatId}
        RETURNING title
    `
    return newTitle
}