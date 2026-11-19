import { Router } from "express";
import db from "../../database/db.js";
import crypto from "crypto";

import {
	getConnectionsForOrganization,
	enableOrgConnection,
	disableOrgConnection,
	deleteOrgConnection,
	updateOrgConnectionConfig,
	getConnection,
} from "./connection.service.js";
import { requireActiveSubscription, requireOwner } from "../middleware.js";
import { getAccessToken, oauthProviders } from "./connection.helper.js";
import { FILE_TYPES } from "../../ai-bot/tools/googleDrive.js";
import { FRONTEND_URL } from "../../constants.js";

const router = Router();

export const states = new Map();

router.get("/", async (req, res) => {
	const orgId = req.orgId;

	const connections = await getConnectionsForOrganization(orgId);

	res.status(200).json(connections);
});

router.use(requireOwner, requireActiveSubscription);

router.get("/:connectionId/connect", async (req, res) => {
	const orgId = req.orgId;
	const slug = req.slug;
	const connectionId = req.params.connectionId;

	const connection = await getConnection(connectionId, orgId);

	if (!connection || connection.auth_type !== "oauth" || !oauthProviders[connection.key]) {
		return res.redirect(
			`${FRONTEND_URL}/w/${slug}/connecties?connected=${connection?.key ?? ""}&status=mislukt`,
		);
	}

	const url = oauthProviders[connection.key].authUrl({
		orgId,
		slug,
		key: connection.key,
		connectionId,
	});

	return res.redirect(url);
});

router.post("/:connectionId/connect", async (req, res) => {
	const orgId = req.orgId;
	const connectionId = req.params.connectionId;
	const config = req.body.config ?? {};

	const connection = await getConnection(connectionId, orgId);
	if (!connection) {
		return res.status(404).json({ error: "Connectie niet gevonden." });
	}

	// Bestaat al maar staat uit: weer aanzetten (ook voor OAuth, tokens zijn er nog)
	if (connection.organization_connection?.enabled === false) {
		const orgConnection = await enableOrgConnection(orgId, connectionId);
		return res.status(200).json(orgConnection);
	}

	switch (connection.auth_type) {
		case "public": {
			const orgConnection = await enableOrgConnection(orgId, connectionId);
			return res.status(201).json(orgConnection);
		}

		// case "api_key": {
		// 	const orgConnection = await connectApiKey(orgId, connectionId, config);
		// 	return res.status(201).json(orgConnection);
		// }

		case "oauth":
			// Een nieuwe OAuth-koppeling loopt via de GET (redirect), niet via fetch
			return res.status(400).json({
				error: "Deze connectie koppel je door in te loggen bij de dienst zelf.",
			});

		default:
			return res.status(400).json({ error: "Dit type koppeling wordt niet ondersteund." });
	}
});

router.patch("/:orgConnectionId/disable", async (req, res) => {
	const orgId = req.orgId;
	const orgConnectionId = req.params.orgConnectionId;

	await disableOrgConnection(orgId, orgConnectionId);

	res.status(204).end();
});

router.patch("/:orgConnectionId/config", async (req, res) => {
	const orgId = req.orgId;
	const orgConnectionId = req.params.orgConnectionId;
	const config = req.body.config;

	await updateOrgConnectionConfig(orgId, orgConnectionId, config);

	res.status(200).json({
		success: true,
	});
});

router.delete("/:orgConnectionId", async (req, res) => {
	const orgId = req.orgId;
	const orgConnectionId = req.params.orgConnectionId;

	const orgConn = await deleteOrgConnection(orgId, orgConnectionId);
	
	const provider = oauthProviders[orgConn.key];
	await provider.revoke(orgConn.config)

	res.status(200).json({
		success: true,
	});
});

router.get("/:orgConnectionId/picker", async (req, res) => {
	const { orgConnectionId } = req.params;
	const orgId = req.orgId;

	const [orgConn] = await db`
		SELECT oc.id, oc.config, c.key
		FROM organization_connections oc
		JOIN connections c ON c.id = oc.connection_id
		WHERE oc.id = ${orgConnectionId}::uuid
			AND oc.organization_id = ${orgId}::uuid
			AND oc.enabled = true;
	`;

	if (!orgConn)
		return res.status(404).json({ error: "Connectie niet gevonden." });

	// Ververst het token als het bijna verlopen is
	const accessToken = await getAccessToken(orgConn);

	res.json({
		accessToken,
		apiKey: process.env.GOOGLE_PICKER_API_KEY,
		appId: process.env.GOOGLE_PROJECT_NUMBER,
		mimeTypes: Object.keys(FILE_TYPES),
	});
});

router.get("/:orgConnectionId/items", async (req, res) => {
	const { orgConnectionId } = req.params;
	const orgId = req.orgId;

	// 1. Koppeling ophalen én controleren dat hij bij deze workspace hoort
	const [orgConn] = await db`
		SELECT oc.id, oc.config, c.key
		FROM organization_connections oc
		JOIN connections c ON c.id = oc.connection_id
		WHERE oc.id = ${orgConnectionId}::uuid
			AND oc.organization_id = ${orgId}::uuid
			AND oc.enabled = true;
	`;

	if (!orgConn) {
		return res.status(404).json({ error: "Connectie niet gevonden." });
	}

	// 2. Geldige access token (ververst zo nodig)
	const token = await getAccessToken(orgConn);

	// 3. Alle bestanden waar Raggy toegang toe heeft. Google geeft max 100 per
	//    keer, dus doorlopen met nextPageToken.
	const files = [];
	let pageToken;

	do {
		const params = new URLSearchParams({
			q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
			fields: "nextPageToken, files(id, name, mimeType, webViewLink, iconLink, modifiedTime)",
			pageSize: "100",
			orderBy: "name",
		});

		if (pageToken) params.set("pageToken", pageToken);

		const r = await fetch(
			`https://www.googleapis.com/drive/v3/files?${params}`,
			{
				headers: { Authorization: `Bearer ${token}` },
			},
		);

		if (!r.ok) {
			console.error("Drive files.list:", r.status, await r.text());
			return res
				.status(502)
				.json({ error: "Google Drive gaf een fout terug." });
		}

		const data = await r.json();
		files.push(...data.files);
		pageToken = data.nextPageToken;
	} while (pageToken);

	// 4. In de vorm die de modal verwacht
	res.json({
		items: files.map((f) => ({
			id: f.id, // nu gewoon het Google fileId
			name: f.name,
			mimeType: f.mimeType,
			isFolder: false,
			url: f.webViewLink,
			iconUrl: f.iconLink,
			modifiedTime: f.modifiedTime,
		})),
	});
});

router.post("/:orgConnectionId/items", async (req, res) => {});

router.delete("/:orgConnectionId/items", async (req, res) => {});

export default router;
