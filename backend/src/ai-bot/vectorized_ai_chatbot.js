import OpenAI from "openai";
import { config } from "dotenv";
import db from '../database/db.js'

import { SYSTEM_PROMPT } from "./prompts.js";
import { EXPERIMENTAL_SYSTEM_PROMPT } from "./prompts.js";



const LLM_MODEL = "gpt-4o-mini";
const EMBED_MODEL = "text-embedding-3-small";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory chat history per session
const chatMemory = new Map();

async function embed(text) {
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

async function retrieve(question, orgId) {
  const embedding = await embed(question);

  // const rows = await db`
  //   SELECT content, videos, links, images, metadata,
  //          1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity
  //   FROM test_document_chunks
  //   ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
  //   LIMIT ${k}
  // `;

  const rows = await db`
    SELECT content, metadata,
           1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity
    FROM document_chunks
    WHERE organization_id = ${orgId}
    ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT 6
  `;

  return rows;
}

export async function promptAI(question, history, orgId) {
  // 1. Retrieval via pgvector
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

  const userContent = `Knowledge Base Context:
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
  console.log(messages.slice(messages.length - 5))

  // 3. Streaming call naar OpenAI, direct schrijven naar res
  const stream = await openai.chat.completions.create({
    model: LLM_MODEL,
    temperature: 1,
    stream: true,
    messages,
  });

  let fullResponse = "";

  async function* trackAndStream() {
    for await (const chunk of stream) {
      
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        yield {
          event: "token",
          content: content
        };
      }
    }
  }

  return trackAndStream()

}