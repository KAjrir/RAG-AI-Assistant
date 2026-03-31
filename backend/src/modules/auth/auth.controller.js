import { Router } from "express"
import bcrypt from "bcrypt"

import { getInvitation, getUserId, createUser, getUserInfo, updateUserLastLogin, getOrgs} from "./auth.service.js"
import { signToken, verifyToken } from "./jwt.js"
import { ISPROD } from "../../constants.js"

const router = Router()

router.get("/me", async (req, res) => {
    const { auth_token } = req.cookies
    if (!auth_token) return res.status(200).json({ user: null })
    
    try {
        const { user } = verifyToken(auth_token)

        const safeUserCredentials = {
            id: user.id,
            name: user.name,
            email: user.email
        }

        res.status(200).json({ 
            user: safeUserCredentials
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

    const [existingUser] = await getUserId({ email });

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
        const orgs = await getOrgs(createdUser.id)

        const token = signToken({
            user: createdUser,
            orgs: orgs
        })

        res.cookie("auth_token", token, {
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Dagen
            httpOnly: true,
            sameSite: "lax",
            secure: ISPROD
        })
        
        res.status(201).json({
            user: createdUser,
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({error: err.message})
    }
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body

    if (!email.trim() || !password.trim()){
        return res.status(400).json({ error: 'Email and password are required' })
    }

    const [user] = await getUserInfo( {email} )
    if(!user){
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    console.log(user)
    await updateUserLastLogin(user.id)
    
    const safeUserCredentials = {
        id: user.id,
        name: user.name,
        email: user.email
    }

    const orgs = await getOrgs(user.id)

    const token = signToken({
        user: safeUserCredentials,
        orgs: orgs
    })

    res.cookie("auth_token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Dagen
        httpOnly: true,
        sameSite: "lax",
        secure: ISPROD
    })

    res.status(200).json({
        user: safeUserCredentials,
    })
})

router.post("/logout", async (req, res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: ISPROD,
    });

    res.status(200).json({ message: "Logged out succesfully"} )
})

export default router