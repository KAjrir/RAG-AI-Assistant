export const openaiToolFormat = (availableTools) => {
    const tools = [];
    for (const tool of availableTools) {
        const requiredParams = Object.entries(tool.parameters).map( ([key, value]) => !!value.required ? key : null).filter(f => f)
        Object.entries(tool.parameters).forEach( ([key, value], i) => delete value.required)

        const formattedTool = {
            type: "function",
            name: tool.tool_key,
            description: tool.description,
            parameters: {
                type: "object",
                properties: tool.parameters,
                required: requiredParams,
                additionalProperties: false
            },
        };

        tools.push(formattedTool)
    }
    return tools
};