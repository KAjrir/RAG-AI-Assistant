import db from "../../database/db.js";

export const listDocuments = {
	definition: {
		type: "function",
		name: "list_documents",
		description: "Geef een overzicht van alle documenten in deze workspace die doorzocht kunnen worden.\n" +
			"Gebruik deze tool wanneer de gebruiker vraagt welke documenten er \n" +
			"zijn, of een bepaald bestand aanwezig is, hoeveel documenten er zijn \n" +
			"of wat er recent is toegevoegd. Gebruik hem ook als je niet zeker \n" +
			"weet of een document bestaat voordat je gaat zoeken. \n" +
			"Deze tool geeft GEEN inhoud terug, alleen bestandsnamen, aantal \n" +
			"pagina's en uploaddatum. Gebruik search_documents om in de inhoud \n" +
			"te zoeken.",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description:
						"Optioneel: (deel van) een bestandsnaam om op te filteren, bijv. 'contract' of 'handboek'.",
				},
			},
			required: [],
			additionalProperties: false,
		},
	},

	execute: async ({ query } = {}, organizationId) => {
		if (!organizationId) throw new Error("organizationId ontbreekt");

		const pattern = query?.trim() ? `%${query.trim()}%` : null;

		const rows = await db`
			SELECT
				id,
				originalname,
				page_count,
				uploaded_at
			FROM documents
			WHERE organization_id = ${organizationId}::uuid
				AND status = 'completed'
				AND (${pattern}::text IS NULL OR originalname ILIKE ${pattern})
			ORDER BY uploaded_at DESC;
		`;

		return {
			count: rows.length,
			documents: rows.map((row) => ({
				documentId: row.id,
				filename: row.originalname,
				pageCount: row.page_count ?? null,
				uploadedAt: row.uploaded_at,
			})),
		};
	},
};