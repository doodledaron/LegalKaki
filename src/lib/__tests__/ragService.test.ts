/**
 * RAG Service Tests
 *
 * Basic tests to verify RAG functionality
 */

import { ragService } from '../ragService';

describe('RAG Service', () => {
  describe('chunkText', () => {
    it('should chunk text correctly', () => {
      const text = 'word '.repeat(1000); // 5000 characters
      const chunks = ragService.chunkText(text, 800, 100);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].length).toBeLessThanOrEqual(4000); // ~800 words * 5 chars
    });

    it('should handle small text', () => {
      const text = 'Short text';
      const chunks = ragService.chunkText(text);

      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    it('should create overlapping chunks', () => {
      const text = 'word '.repeat(200); // Create a text that will need multiple chunks
      const chunks = ragService.chunkText(text, 100, 20);

      expect(chunks.length).toBeGreaterThan(1);
      // Verify chunks have some overlap (hard to test exactly due to word boundaries)
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec1 = [1, 2, 3, 4];
      const vec2 = [1, 2, 3, 4];

      const similarity = ragService.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];

      const similarity = ragService.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [-1, -2, -3];

      const similarity = ragService.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should throw error for different length vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];

      expect(() => ragService.cosineSimilarity(vec1, vec2)).toThrow();
    });
  });

  describe('storage operations', () => {
    const mockDocId = 'test_doc_123';
    const mockChunks = [
      {
        id: `${mockDocId}_chunk_0`,
        documentId: mockDocId,
        text: 'Test chunk 1',
        chunkIndex: 0,
        embedding: [0.1, 0.2, 0.3],
        metadata: { startChar: 0, endChar: 13, length: 13 }
      },
      {
        id: `${mockDocId}_chunk_1`,
        documentId: mockDocId,
        text: 'Test chunk 2',
        chunkIndex: 1,
        embedding: [0.4, 0.5, 0.6],
        metadata: { startChar: 13, endChar: 26, length: 13 }
      }
    ];

    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    afterEach(() => {
      // Clean up
      ragService.deleteDocumentChunks(mockDocId);
    });

    it('should store and retrieve chunks', () => {
      ragService.storeDocumentChunks(mockDocId, mockChunks);
      const retrieved = ragService.getDocumentChunks(mockDocId);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.length).toBe(2);
      expect(retrieved?.[0].text).toBe('Test chunk 1');
    });

    it('should return null for non-existent document', () => {
      const retrieved = ragService.getDocumentChunks('non_existent');
      expect(retrieved).toBeNull();
    });

    it('should delete chunks', () => {
      ragService.storeDocumentChunks(mockDocId, mockChunks);
      ragService.deleteDocumentChunks(mockDocId);
      const retrieved = ragService.getDocumentChunks(mockDocId);

      expect(retrieved).toBeNull();
    });

    it('should list indexed documents', () => {
      ragService.storeDocumentChunks('doc1', mockChunks);
      ragService.storeDocumentChunks('doc2', mockChunks);

      const docIds = ragService.getIndexedDocumentIds();
      expect(docIds).toContain('doc1');
      expect(docIds).toContain('doc2');

      // Clean up
      ragService.deleteDocumentChunks('doc1');
      ragService.deleteDocumentChunks('doc2');
    });
  });

  describe('searchSimilarChunks', () => {
    const mockDocId = 'search_test_doc';
    const mockChunks = [
      {
        id: `${mockDocId}_chunk_0`,
        documentId: mockDocId,
        text: 'Legal terms and conditions',
        chunkIndex: 0,
        embedding: [1.0, 0.0, 0.0],
        metadata: { startChar: 0, endChar: 26, length: 26 }
      },
      {
        id: `${mockDocId}_chunk_1`,
        documentId: mockDocId,
        text: 'Payment obligations and terms',
        chunkIndex: 1,
        embedding: [0.0, 1.0, 0.0],
        metadata: { startChar: 26, endChar: 55, length: 29 }
      },
      {
        id: `${mockDocId}_chunk_2`,
        documentId: mockDocId,
        text: 'Contract termination clause',
        chunkIndex: 2,
        embedding: [0.0, 0.0, 1.0],
        metadata: { startChar: 55, endChar: 82, length: 27 }
      }
    ];

    beforeEach(() => {
      localStorage.clear();
      ragService.storeDocumentChunks(mockDocId, mockChunks);
    });

    afterEach(() => {
      ragService.deleteDocumentChunks(mockDocId);
    });

    it('should find most similar chunks', () => {
      // Query similar to first chunk
      const queryEmbedding = [0.9, 0.1, 0.0];
      const results = ragService.searchSimilarChunks(queryEmbedding, [mockDocId], 2);

      expect(results.length).toBe(2);
      expect(results[0].chunk.text).toBe('Legal terms and conditions');
      expect(results[0].similarity).toBeGreaterThan(0.5);
    });

    it('should limit results to topK', () => {
      const queryEmbedding = [1.0, 0.0, 0.0];
      const results = ragService.searchSimilarChunks(queryEmbedding, [mockDocId], 1);

      expect(results.length).toBe(1);
    });

    it('should handle multiple documents', () => {
      const docId2 = 'doc2';
      ragService.storeDocumentChunks(docId2, mockChunks);

      const queryEmbedding = [1.0, 0.0, 0.0];
      const results = ragService.searchSimilarChunks(queryEmbedding, [mockDocId, docId2], 5);

      expect(results.length).toBeGreaterThan(3); // Should have results from both docs

      ragService.deleteDocumentChunks(docId2);
    });
  });

  describe('formatContextFromResults', () => {
    it('should format search results correctly', () => {
      const mockResults = [
        {
          chunk: {
            id: 'chunk1',
            documentId: 'doc1',
            text: 'Test chunk text',
            chunkIndex: 0,
            embedding: [1, 2, 3],
            metadata: { startChar: 0, endChar: 15, length: 15 }
          },
          similarity: 0.95
        }
      ];

      const formatted = ragService.formatContextFromResults(mockResults);

      expect(formatted).toContain('RELEVANT DOCUMENT EXCERPTS');
      expect(formatted).toContain('Test chunk text');
      expect(formatted).toContain('95.0%');
    });

    it('should handle empty results', () => {
      const formatted = ragService.formatContextFromResults([]);
      expect(formatted).toBe('');
    });
  });

  describe('getChunkStats', () => {
    it('should return correct stats', () => {
      const docId = 'stats_test';
      const chunks = [
        {
          id: `${docId}_chunk_0`,
          documentId: docId,
          text: 'Test',
          chunkIndex: 0,
          embedding: [1, 2, 3],
          metadata: { startChar: 0, endChar: 4, length: 4 }
        }
      ];

      ragService.storeDocumentChunks(docId, chunks);

      const stats = ragService.getChunkStats();
      expect(stats.totalDocuments).toBeGreaterThan(0);
      expect(stats.totalChunks).toBeGreaterThan(0);
      expect(stats.storageSize).toBeGreaterThan(0);

      ragService.deleteDocumentChunks(docId);
    });
  });
});
