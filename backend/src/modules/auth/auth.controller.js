import { Router } from "express"
import bcrypt from "bcrypt"

import { getInvitation, getUserId, createUser, getUserInfo, updateUserLogin} from "./auth.service.js"
import { signToken } from "./jwt.js"

const router = Router()

router.post("/register", async (req, res) => {
    const { name, email, password, inviteToken } = req.body;
    
    if (!name.trim() || !email.trim() || !password.trim()) {
        return res.status(400).json({ error: 'Name, email and password are required' })
    }
    
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

        const result = await createUser(name, email, passwordHash, invitation)

        const token = signToken(result.id)
        
        res.status(201).json({token})

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

    await updateUserLogin(user.id)
    
    const token = signToken(user.id)
    res.status(200).json({ token })
})

export default router