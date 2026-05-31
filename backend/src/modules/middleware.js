import { PLANS } from "../config/plans.config.js";
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
  req.plan = PLANS[membership.organization_plan]
  next()
}

export function requirePolicy(policy, action, getResource = null) {
  return async (req, res, next) => {
    try {
      // Haal resource op als die nodig is
      const resource = getResource ? await getResource(req) : null

      if (getResource && !resource) {
        return res.status(404).json({ error: 'Niet gevonden' })
      }

      // Voer de policy uit
      const result = policy[action](req.role, resource)

      if (!result.allowed) {
        return res.status(403).json({ error: result.reason })
      }

      // Zet resource op req zodat controller hem niet opnieuw hoeft op te halen
      if (resource) req.resource = resource

      next()
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Server fout' })
    }
  }
}

export function requireOwner(req, res, next) {
  if(req.role !== "owner") {
    return res.status(403).json({ error: 'Alleen de owner heeft toegang'})
  }

  next()
}

export function requireActiveSubscription(req, res, next) {
  if(!req.plan) return next();
  
  if (!['paid', 'active'].includes(req.plan)) {
    return res.status(403).json({ 
      error: 'Abonnement vereist',
      action: 'upgrade_plan'
    })
  }
  next()
}