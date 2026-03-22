import { Router } from "express"
import bcrypt from "bcrypt"

import { getInvitation, getUserId, createUser, getUserInfo, updateUserLogin, getOrgAndMembershipInfo} from "./auth.service.js"
import { signToken, verifyToken } from "./jwt.js"
import { ISPROD } from "../../server.js"

const router = Router()

router.get("/me", async (req, res) => {
    const { auth_token } = req.cookies
    if (!auth_token) return res.status(401).json({ message: "Unauthorized"})
    
    try {
        const decoded = verifyToken(auth_token)
        const organizations = await getOrgAndMembershipInfo(decoded.id)

        const safeUserCredentials = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email
        }

        return res.status(200).json({ 
            user: safeUserCredentials,
            organizations
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

        const organizations = await getOrgAndMembershipInfo(createdUser.id)


        const token = signToken(createdUser)

        res.cookie("auth_token", token, {
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Dagen
            httpOnly: true,
            sameSite: ISPROD ? "none" : "lax",
            secure: ISPROD
        })
        
        res.status(201).json({
            user: createdUser,
            organizations
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
    await updateUserLogin(user.id)
    
    const safeUserCredentials = {
        id: user.id,
        name: user.name,
        email: user.email
    }

    const organizations = await getOrgAndMembershipInfo(user.id)

    const token = signToken(safeUserCredentials)

    res.cookie("auth_token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Dagen
        httpOnly: true,
        sameSite: ISPROD ? "none" : "lax",
        secure: ISPROD
    })

    res.status(200).json({
        user: safeUserCredentials,
        organizations
    })
})

router.post("/logout", async (req, res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        sameSite: ISPROD ? "none" : "lax",
        secure: ISPROD,
    });

    res.status(200).json({ message: "Logged out succesfully"} )
})

export default router