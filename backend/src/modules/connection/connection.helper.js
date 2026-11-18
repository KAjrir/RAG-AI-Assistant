import crypto from "crypto";
import { states } from "./connection.controller.js";
import db from "../../database/db.js";

export const oauthProviders = {
	google_drive: {
		authUrl: (orgId, key, connectionId) => {
			const state = crypto.randomBytes(32).toString("base64url");
			const codeVerifier = crypto.randomBytes(32).toString("base64url");
			const codeChallenge = crypto
				.createHash("sha256")
				.update(codeVerifier)
				.digest("base64url");

			states.set(`${state}`, {
				key,
				orgId,
				codeVerifier,
				connectionId,
			});

			const params = new URLSearchParams({
				client_id: process.env.GOOGLE_CLIENT_ID,
				redirect_uri: process.env.GOOGLE_REDIRECT_URI,
				response_type: "code",
				scope: "https://www.googleapis.com/auth/drive.file",
				access_type: "offline",
				prompt: "consent",
				state,
				code_challenge: codeChallenge,
				code_challenge_method: "S256",
			});

			const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
			return authUrl;
		},
		exchangeCode: async (code, codeVerifier) => {
			const response = await fetch(
				"https://oauth2.googleapis.com/token",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						client_id: process.env.GOOGLE_CLIENT_ID,
						client_secret: process.env.GOOGLE_CLIENT_SECRET,
						redirect_uri: process.env.GOOGLE_REDIRECT_URI,
						grant_type: "authorization_code",
						code,
						code_verifier: codeVerifier,
					}),
				},
			);

			if (!response.ok) {
				throw new Error("Google token exchange failed");
			}

			const { access_token, refresh_token, scope, expires_in } =
				await response.json();

			return {
				access_token,
				refresh_token,
				scope,
				expires_at: Date.now() + expires_in * 1000,
			};
		},
		async refresh(refreshToken) {
			const res = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: process.env.GOOGLE_CLIENT_ID,
					client_secret: process.env.GOOGLE_CLIENT_SECRET,
					refresh_token: refreshToken,
					grant_type: "refresh_token",
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				// invalid_grant = refresh token is ingetrokken of verlopen
				if (data.error === "invalid_grant") {
					throw new Error(
						"De koppeling met Google Drive is verlopen. Ga naar Connecties en koppel opnieuw.",
					);
				}
				throw new Error(
					"Google Drive reageert niet zoals verwacht. Probeer het zo opnieuw.",
				);
			}

			return {
				access_token: data.access_token,
				// Google stuurt bij een refresh meestal géén nieuw refresh token mee,
				// dus de oude houden. (Microsoft stuurt wel een nieuwe, daarom deze ??)
				refresh_token: data.refresh_token ?? refreshToken,
				expires_at: Date.now() + data.expires_in * 1000, // expires_in is in seconden
			};
		},
	},

	// onedrive: { authUrl: (state) => …, exchangeCode: async (code) => … }
};

export async function getAccessToken(orgConn) {
	// 1. Welke provider?
	const provider = oauthProviders[orgConn.key];
	if (!provider) {
		throw new Error(
			`Connectie "${orgConn.key}" werkt niet met inloggen via OAuth.`,
		);
	}

	// 2. Zijn er tokens?
	const config = orgConn.config ?? {};
	if (!config.access_token || !config.refresh_token) {
		throw new Error(
			"Deze connectie is nog niet gekoppeld. Ga naar Connecties en klik op Koppelen.",
		);
	}

	// 3. Nog minstens 60 seconden geldig? Dan gewoon teruggeven
	if (config.expires_at && config.expires_at - Date.now() > 60_000) {
		return config.access_token;
	}

	// 4. Verversen (gooit zelf RECONNECT / PROVIDER_ERROR als het misgaat)
	const fresh = await provider.refresh(config.refresh_token);

	// 5. Opslaan: || voegt de nieuwe velden samen met wat er al in config staat
	await db`
		UPDATE organization_connections
		SET config = config || ${JSON.stringify(fresh)}::jsonb
		WHERE id = ${orgConn.id}::uuid;
	`;

	return fresh.access_token;
}
