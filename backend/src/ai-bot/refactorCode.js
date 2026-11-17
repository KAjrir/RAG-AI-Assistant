import fs from "fs/promises";

export const openaiToolFormat = (availableTools) => {
	const tools = [];

	const searchDocumentsTool = {
		type: "function",
		name: "search_documents",
		description: `
			Zoek informatie in documenten die door de organisatie
			zijn geüpload.

			Gebruik deze tool wanneer een gebruiker vragen stelt
			over contracten, overeenkomsten, voorwaarden,
			bedrijfsdocumenten of andere geüploade bestanden.

			Geef een duidelijke zoekvraag en relevante keywords mee.

			De tool retourneert relevante tekstfragmenten,
			documentnamen en paginanummers.
  		`,
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
	};

	tools.push(searchDocumentsTool);

	for (const tool of availableTools) {
		const requiredParams = Object.entries(tool.parameters)
			.map(([key, value]) => (!!value.required ? key : null))
			.filter((f) => f);
		Object.entries(tool.parameters).forEach(
			([key, value], i) => delete value.required,
		);

		const formattedTool = {
			type: "function",
			name: tool.tool_key,
			description: tool.description,
			parameters: {
				type: "object",
				properties: tool.parameters,
				required: requiredParams,
				additionalProperties: false,
			},
		};

		tools.push(formattedTool);
	}
	return tools;
};

export const openaiInputFormat = async (messages) => {
	const formattedInput = [];

	for (const msg of messages) {
		const content = msg.content;

		const formattedContent = [];

		for (const c of content) {
			if (c.type === "file" || c.type === "image") {
				const base64 = await fs.readFile(c.filepath, "base64");
				const data = `data:${c.mimetype};base64,${base64}`;

				formattedContent.push(
					c.type === "file"
						? {
								type: "input_file",
								filename: c.filename,
								file_data: data,
							}
						: {
								type: "input_image",
								image_url: data,
							},
				);
			} else {
				formattedContent.push(
					msg.role === "user"
						? {
								type: "input_text",
								text: c.text,
							}
						: {
								type: "output_text",
								text: c.text,
							},
				);
			}
		}

		formattedInput.push({
			...msg,
			content: formattedContent,
		});
	}

	return formattedInput;
};

export const openaiInputFormat2 = async (messages) => {
	return Promise.all(
		messages.map(async (msg) => ({
			...msg,
			content: await Promise.all(
				msg.content.map(async (c) => {
					if (c.type === "file" || c.type === "image") {
						const base64 = await fs.readFile(c.filepath, "base64");

						const data = `data:${c.mimetype};base64,${base64}`;

						return c.type === "file"
							? {
									type: "input_file",
									filename: c.filename,
									file_data: data,
								}
							: {
									type: "input_image",
									image_url: data,
								};
					} else {
						return msg.role === "user"
							? {
									type: "input_text",
									text: c.text,
								}
							: {
									type: "output_text",
									text: c.text,
								};
					}
				}),
			),
		})),
	);
};

export const openaiInputFormat3 = async (messages) => {
	const filteredMessages = messages.filter((msg) => {
		if (msg.type === "message" && msg.role === "assistant") {
			if (["streaming", "pending"].includes(msg.status)) {
				return false;
			}

			if (
				Array.isArray(msg.content) &&
				!msg.content.some(
					(c) =>
						(c.type === "text" || c.type === "output_text") &&
						typeof c.text === "string" &&
						c.text.trim() !== "",
				)
			) {
				return false;
			}
		}

		return true;
	});

	return Promise.all(
		filteredMessages.map(async (msg) => {
			// Function call: volledig OpenAI-item staat in content
			if (msg.type === "function_call") {
				console.log("REFACTORCODE MSG FUNCTION_CALL: ", msg);
				return {
					type: "function_call",
					call_id: msg.call_id,
					name: msg.name,
					arguments: msg.arguments,
				};
			}

			// Function output: content is direct de output-array
			if (msg.type === "function_call_output") {
				console.log("REFACTORCODE MSG FUNCTION_CALL_OUTPUT: ", msg);

				return {
					type: "function_call_output",
					call_id: msg.call_id,
					output: msg.output,
				};
			}

			// Normale berichten
			const content = Array.isArray(msg.content)
				? msg.content
				: [{ type: "text", text: msg.content }];

			return {
				role: msg.role,
				content: (
					await Promise.all(
						content.map(async (c) => {
							if (c.type === "file" || c.type === "image") {
								const base64 = await fs.readFile(
									c.filepath,
									"base64",
								);

								const data = `data:${c.mimetype};base64,${base64}`;

								return c.type === "file"
									? {
											type: "input_file",
											filename:
												c.originalname ?? c.filename,
											file_data: data,
										}
									: {
											type: "input_image",
											image_url: data,
										};
							}

							if (c.type === "sources") return null;

							if (
								c.type === "text" ||
								c.type === "input_text" ||
								c.type === "output_text"
							) {
								return {
									type:
										msg.role === "user"
											? "input_text"
											: "output_text",
									text: c.text,
								};
							}

							return null;
						}),
					)
				).filter(Boolean),
			};
		}),
	);
};
