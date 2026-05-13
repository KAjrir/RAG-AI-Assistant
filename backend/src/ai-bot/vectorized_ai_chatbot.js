import OpenAI from "openai";
import db from '../database/db.js'

import { EXPERIMENTAL_SYSTEM_PROMPT2 } from "./prompts.js";


const EMBED_MODEL = "text-embedding-3-small";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(text) {
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

async function call_function(name, args) {
  if (name === "search_sdb") {
    return await sdbGroepRetrieve(args.question, args.keywords)
  }
}

async function sdbGroepRetrieve(question, keywords) {
  const embedding = await embed(question);
  
  const lowercaseKeywords = keywords.map(k => k.toLowerCase());
  const likePatterns = keywords.map(k => `%${k}%`);

  const rows = await db`
    SELECT
      content,
      videos,
      links,
      images,
      metadata,
      1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity,
      CASE 
        WHEN (
          metadata->>'title' ILIKE ANY (${likePatterns})
          OR metadata->>'category' ILIKE ANY (${likePatterns})
          OR string_to_array(lower(metadata->>'tags'), ', ') && ${lowercaseKeywords}::text[]
        ) THEN 0.3
        ELSE 0.0 
      END AS text_boost
    FROM sdb_groep_articles
    WHERE 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > 0.42
    ORDER BY (
      1 - (embedding <=> ${JSON.stringify(embedding)}::vector) + 
      CASE 
        WHEN (
          metadata->>'title' ILIKE ANY (${likePatterns})
          OR metadata->>'category' ILIKE ANY (${likePatterns})
          OR string_to_array(lower(metadata->>'tags'), ', ') && ${lowercaseKeywords}::text[]
        ) THEN 0.3 
        ELSE 0.0 
      END
    ) DESC
    LIMIT 5;
  `;

  console.log(rows)
  return rows;
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

export async function promptAI(userInput, history, orgId) {
  const question = userInput?.userContent ?? ""
  const chatModel = userInput?.model;
  const tools = userInput?.tools

  const historyMessages = history.map( ({ role, content }) => ({ role, content })).slice(0, history.length - 2);
  // console.log(historyMessages)

  const input = [
    { role: "system", content: EXPERIMENTAL_SYSTEM_PROMPT2 },
    ...historyMessages,
    { role: "user", content: question },
  ];

  // console.log(input)

  async function* trackAndStream() {
    while(true) {
      const stream = await client.responses.create({
        model: chatModel,
        stream: true,
        input,
        tools
      });
      
      let response = {};

      for await (const event of stream) {
        // console.log(event)
        if(["response.output_item.added", "response.output_item.done", "response.created", "response.completed"].includes(event.type)) {
          console.dir(event, { depth: null })
        }
  
        if(event.type === "response.output_item.added" && event.item.type === "function_call") {
          response[event.output_index] = event.item
        }
  
        if(event.type === "response.output_text.delta") {
            yield {
              event: "token",
              content: event.delta
            };
        }
  
        if (event.type === "response.function_call_arguments.delta") {
          const index = event.output_index
          if(response[index]) {
            response[index].arguments += event.delta
          }
        }
  
        if(event.type === "response.completed") {
          const toolCalls = Object.values(response).filter( value => value.type === "function_call")
          // console.log("TOOLCALLS: ", toolCalls)
          
          if(toolCalls.length === 0) {
            return
          }
          console.log("WHILE LOOP ZAL NOG DOORGAAN")

          input.push(...event.response.output)
          
          for (const tc of toolCalls) {
            const name = tc.name
            const args = JSON.parse(tc.arguments)
            const result = await call_function(name , args)
            
            input.push({
              type: "function_call_output",
              call_id: tc.call_id,
              output: JSON.stringify(result)
            })
          }
  
          // console.dir(input, { depth: null })
        }
      }
    }
  }

  return trackAndStream()
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
  const historyMessages = history.map( ({ role, content }) => ({ role, content })).slice(0, history.length - 2);

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