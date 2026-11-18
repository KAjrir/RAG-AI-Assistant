import { retrieveDocuments } from "./retrieveDocuments.js";
import { listDocuments } from "./listDocuments.js";

const tools = [retrieveDocuments, listDocuments];

export const toolMap = new Map(tools.map((tool) => [tool.definition.name, tool]));

export const toolDefinitions = tools.map((tool) => tool.definition);
export const toolExecute = async (name, args, orgId) => {
	const tool = toolMap.get(name);

	if (!tool) {
		throw new Error(`Tool not allowed: ${name}`);
	}

	return await tool.execute(args, orgId);
};