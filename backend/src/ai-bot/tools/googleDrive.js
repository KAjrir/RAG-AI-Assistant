// tools/googleDrive.js
import db from "../../database/db.js";
import { getAccessToken } from "../../modules/connection/connection.helper.js";
import SmartParser from "pdf-parse-new/lib/SmartPDFParser.js";

const parser = new SmartParser();

const DRIVE = "https://www.googleapis.com/drive/v3";

// Google-bestanden hebben geen echt bestand: die moet je exporteren
export const FILE_TYPES = {
	// Google-bestanden → Google exporteert ze naar tekst
	"application/vnd.google-apps.document": {
		read: "export",
		as: "text/plain",
	},
	"application/vnd.google-apps.spreadsheet": {
		read: "export",
		as: "text/csv",
	},
	"application/vnd.google-apps.presentation": {
		read: "export",
		as: "text/plain",
	},

	// Tekst → direct lezen
	"text/plain": { read: "text" },
	"text/csv": { read: "text" },
	"text/markdown": { read: "text" },

	// PDF → jouw extractPages
	"application/pdf": { read: "pdf" },

	// Office → Google zet het om, daarna exporteren
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
		read: "convert",
		to: "application/vnd.google-apps.document",
	}, // .docx
	"application/msword": {
		read: "convert",
		to: "application/vnd.google-apps.document",
	}, // .doc
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
		read: "convert",
		to: "application/vnd.google-apps.spreadsheet",
	}, // .xlsx
	"application/vnd.openxmlformats-officedocument.presentationml.presentation":
		{ read: "convert", to: "application/vnd.google-apps.presentation" }, // .pptx
};

const NO_FOLDERS =
	"trashed = false and mimeType != 'application/vnd.google-apps.folder'";

async function readViaGoogle(token, id, name, googleType) {
	// 1. Kopie maken als Google-bestand: Google zet het hierbij om
	const copyRes = await fetch(
		`${DRIVE}/files/${id}/copy?supportsAllDrives=true`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: `Raggy tijdelijk - ${name}`,
				mimeType: googleType,
			}),
		},
	);
	if (!copyRes.ok)
		throw new Error(`${name} omzetten is mislukt (${copyRes.status}).`);
	const copy = await copyRes.json();

	try {
		// 2. De kopie exporteren naar tekst
		const res = await drive(token, `/files/${copy.id}/export`, {
			mimeType: FILE_TYPES[googleType].as,
		});
		return await res.text();
	} finally {
		// 3. Kopie altijd weer weggooien, ook als de export misging
		await fetch(`${DRIVE}/files/${copy.id}?supportsAllDrives=true`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});
	}
}

async function getDriveToken(orgId) {
	const [orgConn] = await db`
		SELECT oc.id, oc.config, c.key
		FROM organization_connections oc
		JOIN connections c ON c.id = oc.connection_id
		WHERE oc.organization_id = ${orgId}::uuid
			AND c.key = 'google_drive'
			AND oc.enabled = true;
	`;
	if (!orgConn) {
		throw new Error("Google Drive is niet gekoppeld in deze workspace.");
	}

	return getAccessToken(orgConn);
}

async function drive(token, path, params = {}) {
	const url = `${DRIVE}${path}?${new URLSearchParams(params)}`;
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (res.status === 404)
		throw new Error(
			"Dit bestand bestaat niet of is niet gedeeld met Raggy.",
		);
	if (!res.ok) throw new Error(`Google Drive gaf een fout (${res.status}).`);
	return res;
}

async function listAll(token, q) {
	const files = [];
	let pageToken = null;

	do {
		const params = {
			q,
			fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
			pageSize: "100",
			corpora: "allDrives",
			includeItemsFromAllDrives: "true",
			supportsAllDrives: "true",
		};
		if (pageToken) params.pageToken = pageToken;

		const data = await (await drive(token, "/files", params)).json();
		files.push(...data.files);
		pageToken = data.nextPageToken;
	} while (pageToken);

	return files.map((f) => ({
		fileId: f.id,
		name: f.name,
		type: f.mimeType,
		modifiedTime: f.modifiedTime,
	}));
}

async function extractPages(buffer) {
	const pages = [];

	const options = {
		// pagerender wordt aangeroepen voor elke pagina
		pagerender: async (pageData) => {
			const textContent = await pageData.getTextContent();

			// Combineer alle text items op deze pagina tot één string
			const pageText = textContent.items
				.map((item) => item.str)
				.join(" ");

			pages.push({
				pageNumber: pageData.pageNumber,
				text: pageText,
			});

			return pageText;
		},
	};

	const smartData = await parser.parse(buffer, options);

	return {
		pages,
		numpages: smartData.numpages,
		info: smartData.info,
		fullText: smartData.text,
	};
}

export async function listDriveFiles(args, organizationId) {
	const token = await getDriveToken(organizationId);
	const files = await listAll(token, NO_FOLDERS);
	return { count: files.length, files };
}

export async function searchDriveFiles({ query }, organizationId) {
	const token = await getDriveToken(organizationId);
	const safe = query.trim().replace(/\\/g, "\\\\").replace(/'/g, "\\'");

	const files = await listAll(
		token,
		`${NO_FOLDERS} and fullText contains '${safe}'`,
	);
	return { count: files.length, files };
}

export async function readDriveFile({ fileId }, organizationId) {
	const token = await getDriveToken(organizationId);
	const id = encodeURIComponent(fileId);

	const meta = await (
		await drive(token, `/files/${id}`, {
			fields: "id, name, mimeType",
			supportsAllDrives: "true",
		})
	).json();

	const type = FILE_TYPES[meta.mimeType];
	if (!type)
		throw new Error(
			`${meta.name} kan Raggy niet lezen (${meta.mimeType}).`,
		);

	let text;

	if (type.read === "export") {
		const res = await drive(token, `/files/${id}/export`, {
			mimeType: type.as,
		});
		text = await res.text();
	} else if (type.read === "text") {
		const res = await drive(token, `/files/${id}`, {
			alt: "media",
			supportsAllDrives: "true",
		});
		text = await res.text();
	} else if (type.read === "pdf") {
		const res = await drive(token, `/files/${id}`, {
			alt: "media",
			supportsAllDrives: "true",
		});
		text = await extractPages(Buffer.from(await res.arrayBuffer()));
	} else if (type.read === "convert") {
		text = await readViaGoogle(token, id, meta.name, type.to);
	}

	return {
		fileId: meta.id,
		name: meta.name,
		content: text,
	};
}
