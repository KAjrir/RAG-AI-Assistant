import { chunkPdf } from './pdfChunker.js'
import { updateDocStatus, generateEmbedding, insertDocumentChunks } from '../workspace/workspace.service.js'

// ============================================================
// Hoe je dit integreert in je processDocument functie
// ============================================================
// Dit is het stuk dat op de achtergrond draait na de upload response

export async function processDocument(documentId, organizationId, filepath, filename) {
  try {
    // 1. Status naar processing
    await updateDocStatus(documentId, "processing")

    // 2. PDF chunken
    const { chunks, meta } = await chunkPdf(filepath, filename)
    console.log(chunks.length)
    // 3. Voor elke chunk een embedding genereren en opslaan

    const completeChunks = [];
    for (const chunk of chunks) {
        console.log("INDEXING CHUNK: ", chunk)
        // OpenAI embedding genereren
        const response = await generateEmbedding(chunk)
        if(!response) continue
        const embedding = response.data[0].embedding

        completeChunks.push({
            documentId,
            organizationId,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            embedding,
            metadata: chunk.metadata
        })

    }
    console.log("INSERTING STATEMENT");
    await insertDocumentChunks(completeChunks);

    console.log("UPDATING DOCUMENT STATUS TO COMPLETED")
    await updateDocStatus(documentId, "completed")

    console.log(`Document ${documentId} verwerkt: ${meta.totalChunks} chunks`)

  } catch (err) {
    console.log("SOMETHING WENT WRONG")
    await updateDocStatus(documentId, "failed")
    console.error(err)
  }
}