import { verifyToken } from "./auth/jwt.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const { auth_token } = req.cookies;

    const { user, orgs} = verifyToken(auth_token); // jouw logic
    // stel je haalt org uit token of database
    req.user = user;
    req.orgs = orgs

    next();
  } catch (err) {
    console.log(err)
    res.status(401).json({ message: "Unauthorized" });
  }
};