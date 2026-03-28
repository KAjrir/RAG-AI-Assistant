import { readFile } from 'node:fs/promises'
import pdf from 'pdf-parse-new'
import { DocumentQueue } from './queue.js'

// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
  maxChunkSize: 1000, // max tekens per chunk
  minChunkSize: 100,  // te kleine chunks weggooien
  overlapSize:  100,  // overlap tussen chunks voor context behoud
}

// ============================================================
// STAP 1: PDF → tekst per pagina
// ============================================================
// We gebruiken de pagerender optie om per pagina tekst bij te houden
// zodat we paginanummer als metadata kunnen meegeven aan elke chunk
async function extractPages(filePath) {
  const buffer = await readFile(filePath)

  const pages = []

  const options = {
    // pagerender wordt aangeroepen voor elke pagina
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent()

      // Combineer alle text items op deze pagina tot één string
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')

      pages.push({
        pageNumber: pageData.pageNumber,
        text: pageText
      })

      return pageText
    }
  }

  const data = await pdf(buffer, options)

  return {
    pages,
    numpages: data.numpages,
    info:     data.info,
    fullText: data.text
  }
}

// ============================================================
// STAP 2: Tekst per pagina opschonen
// ============================================================
function cleanText(text) {
  return text
    .replace(/\f/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
}

// ============================================================
// STAP 3: Tekst semantisch opdelen in chunks
// ============================================================
function splitIntoChunks(text) {
  const chunks    = []
  let   remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= CONFIG.maxChunkSize) {
      if (remaining.trim().length >= CONFIG.minChunkSize) {
        chunks.push(remaining.trim())
      }
      break
    }

    const window = remaining.slice(0, CONFIG.maxChunkSize)
    let   splitAt = -1

    const paraBreak = window.lastIndexOf('\n\n')
    if (paraBreak > CONFIG.minChunkSize) splitAt = paraBreak + 2

    if (splitAt === -1) {
      const lineBreak = window.lastIndexOf('\n')
      if (lineBreak > CONFIG.minChunkSize) splitAt = lineBreak + 1
    }

    if (splitAt === -1) {
      const sentenceEnd = Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
        window.lastIndexOf('.\n'),
      )
      if (sentenceEnd > CONFIG.minChunkSize) splitAt = sentenceEnd + 2
    }

    if (splitAt === -1) {
      const commaBreak = Math.max(
        window.lastIndexOf(', '),
        window.lastIndexOf('; '),
      )
      if (commaBreak > CONFIG.minChunkSize) splitAt = commaBreak + 2
    }

    if (splitAt === -1) {
      const spaceBreak = window.lastIndexOf(' ')
      splitAt = spaceBreak > 0 ? spaceBreak + 1 : CONFIG.maxChunkSize
    }

    const chunk = remaining.slice(0, splitAt).trim()
    if (chunk.length >= CONFIG.minChunkSize) chunks.push(chunk)

    const overlapStart = Math.max(0, splitAt - CONFIG.overlapSize)
    remaining = remaining.slice(overlapStart).trim()

    if (overlapStart === 0 && remaining === text) break
  }

  return chunks
}

// ============================================================
// STAP 4: Chunks bouwen met metadata per pagina
// ============================================================
function buildChunks(pages, documentMeta) {
  const allChunks = []
  let   chunkIndex = 0

  for (const page of pages) {
    const cleaned = cleanText(page.text)
    if (!cleaned) continue

    const pageChunks = splitIntoChunks(cleaned)

    for (const content of pageChunks) {
      allChunks.push({
        chunk_index: chunkIndex++,
        content,
        metadata: {
          filename:      documentMeta.filename,
          documentTitle: documentMeta.info?.Title || documentMeta.filename,
          pageNumber:    page.pageNumber,
          totalPages:    documentMeta.numpages,
          totalChunks:   null,
          charCount:     content.length,
        }
      })
    }
  }

  for (const chunk of allChunks) {
    chunk.metadata.totalChunks = allChunks.length
  }

  return allChunks
}

// ============================================================
// HOOFDFUNCTIE
// ============================================================
export async function chunkPdf(filePath, filename) {
  const { pages, numpages, info, fullText } = await extractPages(filePath)
//   console.log("PAGES: ", pages)
//   console.log("NUMPAGES: ", numpages)
//   console.log("INFO: ", info)
//   console.log("FULTEXT: ", fullText)

  // Fallback: als pagerender niet werkte, gebruik fullText als één pagina
  const effectivePages = pages.length > 0
    ? pages
    : [{ pageNumber: 1, text: fullText }]

  const chunks = buildChunks(effectivePages, { filename, numpages, info })
  
  return {
    chunks,
    meta: {
      filename,
      totalPages:  numpages,
      totalChunks: chunks.length,
      title:       info?.Title  || filename,
      author:      info?.Author || null,
    }
  }
}