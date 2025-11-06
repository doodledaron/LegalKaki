/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * Provides document chunking, embedding generation, and similarity search
 * for better context-aware AI responses.
 */

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  chunkIndex: number;
  embedding: number[];
  metadata: {
    startChar: number;
    endChar: number;
    length: number;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const STORAGE_KEY_PREFIX = 'legalkaki_chunks_';

/**
 * Chunk text into overlapping segments
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += (chunkSize - overlap);
  }

  // Ensure we always have at least one chunk
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text);
  }

  return chunks;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Store document chunks with embeddings in localStorage
 */
export function storeDocumentChunks(documentId: string, chunks: DocumentChunk[]): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${documentId}`;
    localStorage.setItem(key, JSON.stringify(chunks));
    console.log(`[RAG] Stored ${chunks.length} chunks for document ${documentId}`);
  } catch (error) {
    console.error('[RAG] Error storing chunks:', error);
    throw new Error('Failed to store document chunks');
  }
}

/**
 * Retrieve document chunks from localStorage
 */
export function getDocumentChunks(documentId: string): DocumentChunk[] | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${documentId}`;
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as DocumentChunk[];
  } catch (error) {
    console.error('[RAG] Error retrieving chunks:', error);
    return null;
  }
}

/**
 * Search for relevant chunks using similarity search
 */
export function searchSimilarChunks(
  queryEmbedding: number[],
  documentIds: string[],
  topK = 5
): SearchResult[] {
  const allResults: SearchResult[] = [];

  // Get chunks from all specified documents
  for (const docId of documentIds) {
    const chunks = getDocumentChunks(docId);
    if (!chunks) continue;

    // Calculate similarity for each chunk
    for (const chunk of chunks) {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      allResults.push({ chunk, similarity });
    }
  }

  // Sort by similarity (highest first) and take top K
  allResults.sort((a, b) => b.similarity - a.similarity);
  return allResults.slice(0, topK);
}

/**
 * Delete document chunks from storage
 */
export function deleteDocumentChunks(documentId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${documentId}`;
    localStorage.removeItem(key);
    console.log(`[RAG] Deleted chunks for document ${documentId}`);
  } catch (error) {
    console.error('[RAG] Error deleting chunks:', error);
  }
}

/**
 * Get all document IDs that have chunks stored
 */
export function getIndexedDocumentIds(): string[] {
  const documentIds: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const docId = key.replace(STORAGE_KEY_PREFIX, '');
        documentIds.push(docId);
      }
    }
  } catch (error) {
    console.error('[RAG] Error getting indexed documents:', error);
  }

  return documentIds;
}

/**
 * Format search results into context string for LLM
 */
export function formatContextFromResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  const contextParts = results.map((result, index) => {
    return `[Chunk ${index + 1}, Relevance: ${(result.similarity * 100).toFixed(1)}%]
${result.chunk.text}`;
  });

  return `--- RELEVANT DOCUMENT EXCERPTS ---

${contextParts.join('\n\n---\n\n')}

--- END OF EXCERPTS ---`;
}

/**
 * Get statistics about stored chunks
 */
export function getChunkStats(): {
  totalDocuments: number;
  totalChunks: number;
  storageSize: number;
} {
  const documentIds = getIndexedDocumentIds();
  let totalChunks = 0;
  let storageSize = 0;

  for (const docId of documentIds) {
    const chunks = getDocumentChunks(docId);
    if (chunks) {
      totalChunks += chunks.length;
      storageSize += JSON.stringify(chunks).length;
    }
  }

  return {
    totalDocuments: documentIds.length,
    totalChunks,
    storageSize,
  };
}

export const ragService = {
  chunkText,
  cosineSimilarity,
  storeDocumentChunks,
  getDocumentChunks,
  searchSimilarChunks,
  deleteDocumentChunks,
  getIndexedDocumentIds,
  formatContextFromResults,
  getChunkStats,
};

export default ragService;
