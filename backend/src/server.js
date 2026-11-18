import fs from "fs/promises";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";

import authRouter from "./modules/auth/auth.controller.js";
import userRouter from "./modules/user/user.controller.js";
import workspaceRouter from "./modules/workspace/workspace.controller.js";
import invitationRouter from "./modules/invitation/invitation.controller.js";

import { requireAuth, requireWorkspace } from "./modules/middleware.js";

import {
	assetsPath,
	uploadsDirectory,
	ISPROD,
	FRONTEND_URL,
} from "./constants.js";

import db from "./database/db.js";
import { states } from "./modules/connection/connection.controller.js";
import { oauthProviders } from "./modules/connection/connection.helper.js";

await fs.mkdir(uploadsDirectory, { recursive: true });

config({
	path: "../.env",
});

const app = express();

app.use(
	express.json({
		limit: "1mb",
	}),
);

// app.use(express.urlencoded())

app.use(cookieParser());

app.set("trust proxy", 1);

app.use(
	cors({
		origin: FRONTEND_URL,
		credentials: true,
	}),
);

// Globale limiter: 60 per minuut
app.use(
	rateLimit({
		windowMs: 60 * 1000,
		max: ISPROD ? 60 : 6000000000,
		standardHeaders: true,
		legacyHeaders: false,
	}),
);

// Route-specifieke limiter: 10 per minuut
const chatLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
});

app.get("/api/auth/:provider/callback", async (req, res) => {
	const { code, state, error } = req.query;
	const { provider } = req.params;

	console.log("CODE: ", code);
	console.log("STATE: ", state);
	console.log("AUTH ERROR: ", error);
	console.log("PROVIDER: ", provider);

	const { orgId, key, codeVerifier, connectionId } = states.get(state);
	states.delete(state);

	console.log(orgId);
	console.log(codeVerifier);

	if (error || !code || !state || !orgId) {
		return res.status(400).send("Authorization failed");
	}

	if (key === "google_drive") {
		const provider = await oauthProviders[key];
		const { access_token, refresh_token, scope } = await provider.exchangeCode(
			code,
			codeVerifier,
		);

		await db`
			INSERT INTO organization_connections (organization_id, connection_id, config)
			VALUES(
				${orgId},
				${connectionId},
				${JSON.stringify({ access_token, refresh_token, scope })}::jsonb
			)
		`;

		return res.redirect("/dashboard");
	}

	if (key === "onedrive") {
	}
});

app.use("/api/auth", authRouter);
app.use("/api/invitations", invitationRouter);
app.use("/api/users", requireAuth, userRouter);
app.use(
	"/api/workspaces/:slug",
	requireAuth,
	requireWorkspace,
	workspaceRouter,
);
app.use(assetsPath, requireAuth, express.static(uploadsDirectory));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server running on port ${PORT}`);
});
