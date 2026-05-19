import fs from "fs/promises";

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

export const openaiInputFormat = async (messages) => {
    const formattedInput = [];

    for (const msg of messages) {
        const content = msg.content

        const formattedContent = []

        for (const c of content) {
            if(c.type === "file" || c.type === "image") {
                const base64 = await fs.readFile(c.filepath, "base64")
                const data = `data:${c.mimetype};base64,${base64}`

                formattedContent.push(c.type === "file" ? 
                    {
                        type: "input_file",
                        filename: c.filename,
                        file_data: data
                    } : {
                        type: "input_image",
                        image_url: data
                    }
                )
            } else {
                formattedContent.push(msg.role === "user" ? 
                    {
                        type: "input_text",
                        text: c.text
                    } : {
                        type: "output_text",
                        text: c.text
                    }
                )
            }
        }

        formattedInput.push({
            ...msg,
            content: formattedContent
        })
    }

    return formattedInput
}

export const openaiInputFormat2 = async (messages) => {
    return Promise.all(
        messages.map(async (msg) => ({
            ...msg,
            content: await Promise.all(
                msg.content.map(async (c) => {
                    if (
                        c.type === "file" ||
                        c.type === "image"
                    ) {
                        const base64 = await fs.readFile(
                            c.filepath,
                            "base64"
                        );

                        const data =
                            `data:${c.mimetype};base64,${base64}`;

                        return c.type === "file"
                            ? {
                                type: "input_file",
                                filename: c.filename,
                                file_data: data
                            }
                            : {
                                type: "input_image",
                                image_url: data
                            };
                    } else {
                        return msg.role === "user" ? 
                            {
                                type: "input_text",
                                text: c.text
                            } : {
                                type: "output_text",
                                text: c.text
                            }
                        
                    }
                })
            )
        }))
    );
};

export const openaiInputFormat3 = async (messages) => {
    return Promise.all(
        messages.map(async (msg) => ({
            ...msg,
            content: (await Promise.all(
                msg.content.map(async (c) => {
                    if (
                        c.type === "file" ||
                        c.type === "image"
                    ) {
                        const base64 = await fs.readFile(
                            c.filepath,
                            "base64"
                        );

                        const data =
                            `data:${c.mimetype};base64,${base64}`;

                        return c.type === "file"
                            ? {
                                type: "input_file",
                                filename: c.filename,
                                file_data: data
                            }
                            : {
                                type: "input_image",
                                image_url: data
                            };
                    } else {

                        if(c.type === "sources") return null

                        return msg.role === "user" ? 
                            {
                                type: "input_text",
                                text: c.text
                            } : {
                                type: "output_text",
                                text: c.text
                            }
                        
                    }
                }))
            ).filter(Boolean)
        }))
    );
};