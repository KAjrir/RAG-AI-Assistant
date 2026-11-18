import { embed } from "../vectorized_ai_chatbot.js";
import db from "../../database/db.js";


export const retrieveDocuments = {
	definition: {
		type: "function",
		name: "search_documents",
		description: "Zoek informatie in documenten die door de organisatie zijn geüpload \n" + 
				"Gebruik deze tool wanneer een gebruiker vragen stelt \n" +
				"over contracten, overeenkomsten, voorwaarden, \n" +
				"bedrijfsdocumenten of andere geüploade bestanden. \n" +
				"Geef een duidelijke zoekvraag en relevante keywords mee. \n" +
				"De tool retourneert relevante tekstfragmenten, \n" +
				"documentnamen en paginanummers.",
		parameters: {
			type: "object",
			properties: {
				question: {
					type: "string",
					description:
						"De zoekvraag waarvoor relevante documentinhoud nodig is.",
				},
				keywords: {
					type: "array",
					items: {
						type: "string",
					},
					description:
						"Relevante zoekwoorden, documentnamen of onderwerpen.",
				},
			},
			required: ["question"],
			additionalProperties: false,
		},
	},
	execute: async ({ question, keywords = [] }, organizationId) => {
		const embedding = await embed(question);

		const likePatterns = keywords.map((k) => `%${k.trim()}%`);

		const rows = await db`
		WITH matched_chunks AS (
		  SELECT
			id,
			document_id,
			organization_id,
			chunk_index,
			content,
			metadata,
	
			1 - (
			  embedding <=>
			  ${JSON.stringify(embedding)}::vector
			) AS similarity,
	
			CASE
			  WHEN (
				metadata->>'documentTitle' ILIKE ANY (${likePatterns}::text[])
				OR metadata->>'filename' ILIKE ANY (${likePatterns}::text[])
			  )
			  THEN 0.3
			  ELSE 0.0
			END AS title_boost,
	
			CASE
			  WHEN content ILIKE ANY (${likePatterns}::text[])
			  THEN 0.1
			  ELSE 0.0
			END AS content_boost
	
		  FROM document_chunks
	
		  WHERE organization_id = ${organizationId}::uuid
		)
	
		SELECT
		  id,
		  document_id,
		  chunk_index,
		  content,
		  metadata,
		  similarity,
		  title_boost,
		  content_boost,
	
		  (
			similarity +
			title_boost +
			content_boost
		  ) AS score
	
		FROM matched_chunks
	
		WHERE
		  similarity > 0.42
		  OR title_boost > 0
	
		ORDER BY score DESC
	
		LIMIT 5;
	  `;

		return rows.map((row) => ({
			documentId: row.document_id,
			chunkIndex: row.chunk_index,

			filename: row.metadata?.filename,
			documentTitle: row.metadata?.documentTitle,
			pageNumber: row.metadata?.pageNumber,
			totalPages: row.metadata?.totalPages,

			content: row.content,

			similarity: Number(row.similarity),
			score: Number(row.score),
		}));
	},
};