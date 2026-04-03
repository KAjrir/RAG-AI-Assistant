import { Router } from "express"
import fs from "fs/promises"
import path from "path"
import bcrypt from "bcrypt"

import { getInvitation, getUser, createUser, getUserInfo, updateUserLastLogin, getOrgs, createResetToken, getPasswordResetToken, updateUserPassword} from "./auth.service.js"
import { signToken, verifyToken } from "./jwt.js"
import { ISPROD } from "../../constants.js"
import { formatTimeForUser, hash, generateRandomToken, getExpirationDate } from "../../utils.js"
import sgMail from "./mailer.js"

const router = Router()

router.get("/me", async (req, res) => {
    const { auth_token } = req.cookies
    if (!auth_token) return res.status(200).json({ user: null })
    
    try {
        const { userId } = verifyToken(auth_token)
        const user = await getUserInfo(userId)

        res.status(200).json({ 
            user
        })

    } catch (err) {
        console.error(err)
        return res.status(401).json({ message: "Invalid or expired token" });
    }
})

router.post("/register", async (req, res) => {
    const { name, email, password, inviteToken } = req.body;
    
    if (!name.trim() || !email.trim() || !password.trim()) {
        return res.status(400).json({ error: 'Name, email and password are required' })
    }
    
    // Betere email en password validation

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existingUser = await getUser ({ email });

    if(existingUser){
        return res.status(400).json({ error: 'Email already in use' });
    }

    let invitation = null;
    if( inviteToken ) {
        const [ invite ] = await getInvitation(inviteToken)
        if (!invite) {
            return res.status(400).json({ error: 'Invite link is invalid or expired' })
        }

        if(invite.email !== email) {
            return res.status(403).json({ error: 'This invite was sent to a different email address' })
        }

        invitation = invite
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        // Returns id, name and email
        const createdUser = await createUser(name, email, passwordHash, invitation)

        const token = signToken({ userId: createdUser.id })

        res.cookie("auth_token", token, {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Dagen
            httpOnly: true,
            sameSite: "lax",
            secure: ISPROD
        })
        
        res.status(201).json({ success: true })

    } catch(err) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body

    if (!email.trim() || !password.trim()){
        return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await getUser({ email })
    if(!user){
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    await updateUserLastLogin(user.id)

    const token = signToken({ userId: user.id })

    res.cookie("auth_token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Dagen
        httpOnly: true,
        sameSite: "lax",
        secure: ISPROD
    })

    res.status(200).json({ success: true })
})

router.post("/logout", async (req, res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: ISPROD,
    });

    res.status(200).json({ success: true })
})

router.post("/forgot-password", async (req, res) => {
    const email = req.body.email;
    const [user] = await getUserInfo({ email })

    if(!user) return res.status(202).end()

    const resetToken = generateRandomToken()
    const expires_at = getExpirationDate(15)
    const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${resetToken}`


    try {
        const hashedResetToken = hash(resetToken)
        await createResetToken(hashedResetToken, user.id, expires_at)
    } catch (err) {
        console.error(err)
    }

    const templateData = {
        reset_url: resetUrl,
        expires_at: formatTimeForUser(expires_at)
    }
    
    const templatesDir = path.resolve(import.meta.dirname, "../../email-templates");
    const filePath = path.join(templatesDir, "forgot-password.html");
    const emailTemplate = await fs.readFile(filePath, "utf8")
    
    const filledTemplate = emailTemplate.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return templateData[key] ?? ""
    })

    const msg = {
        to: email, 
        from: process.env.EMAIL_USER, 
        subject: 'Hierbij uw herstelcode',
        html: filledTemplate,
    }

    await sgMail.send(msg)

    res.status(204).end()
})

router.post("/verify-reset-token", async (req, res) => {
    const resetToken = req.body.resetToken;

    if(!resetToken) {
        return res.status(400).json({ success: false })
    }

    const hashedResetToken = hash(resetToken)

    const token = await getPasswordResetToken(hashedResetToken)
    
    if(!token) {
        return res.status(400).json({ success: false })
    }

    res.status(200).json({ success: true })
})

router.post("/reset-password", async (req, res) => {
    const { resetToken, password} = req.body;
    if(!resetToken || !password) {
        return res.status(400).json({ success: false })
    }

    const hashedResetToken = hash(resetToken)

    const token = await getPasswordResetToken(hashedResetToken)

    if(!token) {
        return res.status(400).json({ success: false })
    }

    const userId = token.user_id
    const hashedPassword = await bcrypt.hash(password, 10)

    await updateUserPassword(userId, hashedPassword)

    res.status(200).json({ success: true })
})

export default router