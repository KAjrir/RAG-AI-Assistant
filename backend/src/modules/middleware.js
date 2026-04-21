import { ISPROD } from "../constants.js";
import { verifyToken } from "./auth/jwt.js";
import { getCurrentMiddlewareWorkspace } from "./workspace/workspace.service.js";

export async function requireAuth(req, res, next) {
  const {auth_token} = req.cookies
  if (!auth_token) return res.status(401).json({ error: 'Not authenticated' })

  try {

    const payload = verifyToken(auth_token)
    if(payload?.error) {
        res.clearCookie("auth_token", {
            httpOnly: true,
            sameSite: "lax",
            secure: ISPROD,
        });
        return res.status(401).json({ code: payload.error})
    }

    req.userId = payload.userId
    next()
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Server error..."})
  }
}


export async function requireWorkspace(req, res, next) {
  const { slug } = req.params

  const membership = await getCurrentMiddlewareWorkspace(req.userId, slug)

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this organization' })
  }

  req.orgId = membership.organization_id
  req.role  = membership.role
  next()
}