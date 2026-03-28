import fs from "fs"
import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import rateLimit from "express-rate-limit";
import { config } from "dotenv";

import authRouter from "./modules/auth/auth.controller.js"
import chatRouter from "./modules/chat/chat.controller.js"
import userRouter from "./modules/user/user.controller.js"
import workspaceRouter from "./modules/workspace/workspace.controller.js"
import docRouter from "./modules/doc/doc.controller.js"

import { authMiddleware } from "./modules/middleware.js";

const __filename = import.meta.filename
const __dirname = import.meta.dirname

export const ISPROD = process.env.NODE_ENV === "production";
export const assetsPath = "/uploads"
export const uploadsDirectory = ISPROD ? `${__dirname}/prodUploads` : `${__dirname}/uploads`

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory)
  console.log("UPLOADS DIRECTORY INITIATED!")
}

console.log(uploadsDirectory)

config({
  path: "../.env"
})

const FRONTEND_URL = process.env.FRONTEND_URL;

const app = express();
app.use(express.json())
app.use(cookieParser())

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Globale limiter: 60 per minuut
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: ISPROD ? 60 : 6000000000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Route-specifieke limiter: 10 per minuut
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(assetsPath, express.static(uploadsDirectory))

app.use("/api/auth", authRouter)
app.use("/api/users", authMiddleware, userRouter)
app.use("/api/chats", authMiddleware, chatRouter)
app.use("/api/workspaces", authMiddleware, workspaceRouter)
app.use("/api/docs", authMiddleware, docRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

const sleep = ms => new Promise(r => setTimeout(r, ms))