import { verifyToken } from "./auth/jwt.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const { auth_token } = req.cookies;
    if (!auth_token) return res.status(401).json({ message: "Unauthorized" });

    const { user, orgs} = verifyToken(auth_token);
    
    req.user = user;
    req.orgs = orgs

    next();
  } catch (err) {
    console.log(err)
    res.status(401).json({ message: "Unauthorized" });
  }
};