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

export const checkSlugAvailability = async (newSlug) => {
    const slug = await db`
        SELECT slug
        FROM organizations
        WHERE slug = ${newSlug}
    `

    return slug[0]
} 