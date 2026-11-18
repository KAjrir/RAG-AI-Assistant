import OpenAI from "openai";
import db from "../database/db.js";

import { SYSTEM_PROMPT } from "./prompts.js";
import { openaiInputFormat } from "./refactorCode.js";

import { toolExecute, toolMap } from "./tools/toolRegistry.js";
import { sdbGroepRetrieve } from "./tools/sdbGroepRetrieve.js";
import { listDriveFiles, searchDriveFiles, readDriveFile } from "./tools/googleDrive.js";

const EMBED_MODEL = "text-embedding-3-small";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(text) {
	const res = await client.embeddings.create({
		model: EMBED_MODEL,
		input: text,
	});
	return res.data[0].embedding;
}

async function call_function(name, args, orgId) {
	if (toolMap.has(name)) {
		return await toolExecute(name, args, orgId);
	}

	switch (name) {
		case "search_sdb":
			return await sdbGroepRetrieve(args);
		case "list_drive_files":
			return await listDriveFiles(args, orgId);
		case "search_drive_files":
			return await searchDriveFiles(args, orgId);
		case "read_drive_file":
			return await readDriveFile(args, orgId);
	}
}

export async function promptAI(userInput, history) {
	const chatModel = userInput.model;
	const tools = userInput.tools;
	const orgId = userInput.orgId;

	const formattedInput = await openaiInputFormat(history);

	const input = [
		{ role: "system", content: SYSTEM_PROMPT },
		...formattedInput,
	];

	// console.log("INPUT: ")
	// console.dir(input, {depth: null})

	async function* trackAndStream() {
		while (true) {
			const stream = await client.responses.create({
				model: chatModel,
				stream: true,
				input,
				tools,
			});

			let response = {};

			for await (const event of stream) {
				// console.dir(event, { depth: null });
				if (
					[
						"response.output_item.added",
						"response.output_item.done",
						"response.created",
						"response.completed",
					].includes(event.type)
				) {
					// console.dir(event, { depth: null });
				}

				if (event.type === "response.output_text.delta") {
					yield {
						type: "token",
						content: event.delta,
					};
				}

				if (
					event.type === "response.output_item.done" &&
					event.item.type === "function_call"
				) {
					response[event.output_index] = event.item;
					yield {
						type: "function_call",
						item: event.item,
					};
				}

				if (event.type === "response.completed") {
					const toolCalls = Object.values(response).filter(
						(value) => value.type === "function_call",
					);
					// console.log("TOOLCALLS: ", toolCalls)

					if (toolCalls.length === 0) {
						return;
					}

					console.log("WHILE LOOP ZAL NOG DOORGAAN");

					input.push(...event.response.output);

					for (const tc of toolCalls) {
						const name = tc.name;
						const args = JSON.parse(tc.arguments);
						const result = await call_function(name, args, orgId);

						const output = [
							{
								type: "input_text",
								text: JSON.stringify(result, null, 2),
							},
						];

						input.push({
							type: "function_call_output",
							call_id: tc.call_id,
							output: output,
						});

						yield {
							type: "function_call_output",
							item: {
								type: "function_call_output",
								call_id: tc.call_id,
								output: output,
							},
						};

						// // Nummers toevoegen aan chunks
						// const sourceMap = {};
						// result.forEach((row, index) => {
						// 	sourceMap[index + 1] = row;
						// });

						// yield {
						// 	type: "sources",
						// 	content: sourceMap,
						// };

						// // OpenAI krijgt genummerde tekst
						// const formattedForLLM = Object.entries(sourceMap)
						// 	.map(
						// 		([id, row]) =>
						// 			`[${id}] ${row.metadata.title}\n${row.content}`,
						// 	)
						// 	.join("\n\n");

						// input.push({
						// 	type: "function_call_output",
						// 	call_id: tc.call_id,
						// 	output: formattedForLLM,
						// });

						// yield {
						// 	type: "function_call_output",
						// 	item: {
						// 		type: "function_call_output",
						// 		call_id: tc.call_id,
						// 		output: formattedForLLM,
						// 	},
						// };

						// console.log("formattedForLLM: ")
						// console.dir(formattedForLLM, { depth: null })
					}

					// console.dir(input, { depth: null })
				}
			}
		}
	}

	return trackAndStream();
}

async function generalRetrieve(question, orgId) {
	const embedding = await embed(question);

	const rows = await db`
    SELECT content, metadata,
           1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity
    FROM document_chunks
    WHERE organization_id = ${orgId}
    ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT 3
  `;

	return rows;
}

async function generalRagLookup() {
	const docs = await retrieve(question, orgId);
	// console.log(docs)

	const context = docs.map((d) => d.content).join("\n\n");

	const allVideos = docs.flatMap((d) => d.videos ?? []);
	const allLinks = docs.flatMap((d) => d.links ?? []);
	const allImages = docs.flatMap((d) => d.images ?? []);

	const videoText =
		allVideos.length > 0
			? allVideos.map((v) => `- ${v}`).join("\n")
			: "Geen videos beschikbaar";

	const linkText =
		allLinks.length > 0
			? allLinks.map((l) => `- ${l}`).join("\n")
			: "Geen links beschikbaar";

	const imageText =
		allImages.length > 0
			? allImages.map((i) => `- ${i.url}`).join("\n")
			: "Geen fotos beschikbaar";

	// 2. Messages opbouwen
	// Laatste 2 eraf want die komen van de database. Dit is om de juiste content te sturen naar de llm provider
	const historyMessages = history
		.map(({ role, content }) => ({ role, content }))
		.slice(0, history.length - 2);

	const userContent = `
  Knowledge Base Context:
  ${context}

  Available Videos:
  ${videoText}

  Available Links:
  ${linkText}

  Available Images:
  ${imageText}

  User Question: ${question}

  Follow the RESPONSE FORMAT strictly and render media properly.`;

	const messages = [
		{ role: "system", content: EXPERIMENTAL_SYSTEM_PROMPT },
		...historyMessages,
		{ role: "user", content: userContent },
	];
	// console.log(messages.slice(messages.length - 5))
}
