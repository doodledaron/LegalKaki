/**
 * Chat Service
 *
 * Simplified chat service that works entirely client-side:
 * - Uploads PDFs to localStorage (not backend)
 * - Extracts text from PDFs in browser
 * - Calls Gemini Flash API directly
 * - Formats responses into 3-tab structure
 */

import { extractTextFromPDF, cleanPDFText, truncateText } from '@/lib/pdfExtractor';
import { addDocument } from '@/lib/localStorage-utils';
import { storeFileBlob } from '@/lib/indexedDB-utils';
import { geminiService } from './geminiService';
import { ragService, type DocumentChunk } from '@/lib/ragService';
import { storageMonitor } from '@/lib/storageMonitor';
import type {
  UploadDocumentResponse,
  SendMessageRequest,
  SendMessageResponse,
  AnalysisResult,
} from './types';
import type { Message, LegalDomain, Document } from '@/types';

/**
 * Upload a document (PDF) for chat
 * Stores in localStorage, extracts text client-side, chunks and embeds for RAG
 */
export async function uploadDocument(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadDocumentResponse> {
  try {
    console.log('[Chat Service] Uploading document:', file.name);

    // Check storage space before starting
    const stats = storageMonitor.getStorageStats();
    console.log(`[Chat Service] Storage: ${storageMonitor.formatBytes(stats.used)} / ${storageMonitor.formatBytes(stats.total)} (${stats.percentUsed.toFixed(1)}%)`);

    // If storage is over 80% full, clear oldest document
    if (stats.percentUsed > 80) {
      console.warn('[Chat Service] Storage >80% full, clearing oldest document...');
      storageMonitor.clearOldestDocuments(1);
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    // Step 1: Extract text from PDF (10-70% progress)
    onProgress?.(10);
    const extractionResult = await extractTextFromPDF(file, (extractProgress) => {
      // Map extraction progress to 10-70%
      const mappedProgress = 10 + (extractProgress * 0.6);
      onProgress?.(Math.round(mappedProgress));
    });

    console.log('[Chat Service] Extraction result:', extractionResult);

    // Step 2: Generate document ID
    onProgress?.(70);
    const documentId = `doc_${Date.now()}`;

    // Step 2.5: Save file blob to IndexedDB for PDF viewing (avoids localStorage quota issues)
    console.log('[Chat Service] Saving PDF file blob to IndexedDB...');
    await storeFileBlob(documentId, file.name, file.type, file);
    console.log('[Chat Service] PDF file blob saved to IndexedDB');

    // Step 3: Store document metadata with extracted text (no PDF binary needed for RAG)
    const cleanedText = cleanPDFText(extractionResult.text);
    const documentMetadata = {
      id: documentId,
      originalFilename: file.name,
      storedFilename: file.name,
      fileType: file.type,
      fileSize: file.size,
      s3Bucket: 'local-storage', // Not used in client-side mode
      s3Key: documentId, // Not used in client-side mode
      uploadDate: new Date(),
      analysisStatus: 'completed' as const,
      contentText: cleanedText,
      contentSummary: `PDF document with ${extractionResult.pageCount} pages`,
      metadata: {
        pages: extractionResult.pageCount,
        title: extractionResult.metadata?.title,
        author: extractionResult.metadata?.author,
        extractedTextLength: extractionResult.text.length,
      },
    };

    addDocument(documentMetadata);

    // Step 6: RAG - Chunk and embed the document (70-100% progress)
    onProgress?.(75);
    console.log('[Chat Service] Starting RAG indexing...');

    // Chunk the text
    const chunks = ragService.chunkText(cleanedText);
    console.log(`[Chat Service] Created ${chunks.length} chunks`);

    onProgress?.(80);

    // Generate embeddings for all chunks
    const embeddings = await geminiService.generateEmbeddingsBatch(chunks);
    console.log(`[Chat Service] Generated ${embeddings.length} embeddings`);

    onProgress?.(90);

    // Create document chunks with embeddings
    const documentChunks: DocumentChunk[] = chunks.map((chunkText, index) => ({
      id: `${documentId}_chunk_${index}`,
      documentId,
      text: chunkText,
      chunkIndex: index,
      embedding: embeddings[index],
      metadata: {
        startChar: 0, // We don't track exact positions in this implementation
        endChar: chunkText.length,
        length: chunkText.length,
      },
    }));

    // Store chunks with embeddings
    ragService.storeDocumentChunks(documentId, documentChunks);
    console.log(`[Chat Service] Stored ${documentChunks.length} chunks with embeddings`);

    onProgress?.(100);

    console.log('[Chat Service] Document uploaded and indexed successfully:', {
      id: documentId,
      pages: extractionResult.pageCount,
      textLength: extractionResult.text.length,
      chunks: chunks.length,
    });

    // Log final storage stats
    storageMonitor.logStorageStats();

    return {
      document: documentMetadata,
      uploadUrl: `local-storage://${documentId}`, // Mock URL
    };
  } catch (error) {
    console.error('[Chat Service] Upload failed:', error);

    // If storage quota exceeded, provide helpful message
    if (error instanceof Error && error.message.includes('quota')) {
      console.error('[Chat Service] Storage quota exceeded! Clearing oldest documents...');
      storageMonitor.clearOldestDocuments(2);
      throw new Error('Storage full. Oldest documents cleared. Please try uploading again.');
    }

    throw error;
  }
}

/**
 * Send a message in chat with document context
 * Calls Gemini Flash directly, no backend
 * Uses RAG for similarity search to find relevant document chunks
 */
export async function sendMessage(
  request: SendMessageRequest,
  chatHistory: Message[],
  documentText?: string
): Promise<SendMessageResponse> {
  try {
    console.log('[Chat Service] Sending message:', request.content);

    // Create user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: request.content,
      sender: 'user',
      timestamp: new Date(),
      domain: request.domain as LegalDomain,
      type: 'text',
      attachments: request.uploadedDocuments?.map(doc => ({
        id: doc.id,
        filename: doc.originalFilename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        url: `#document-${doc.id}`,
        uploadDate: new Date(),
      })),
    };

    // RAG: Use similarity search if we have uploaded documents
    let contextText = documentText || '';
    let retrievedChunks: Array<{ text: string; similarity: number; chunkIndex: number }> = [];

    if (request.uploadedDocuments && request.uploadedDocuments.length > 0) {
      console.log('[Chat Service] Using RAG for document context...');

      // Generate embedding for user's question
      const queryEmbedding = await geminiService.generateEmbedding(request.content);
      console.log('[Chat Service] Generated query embedding');

      // Get document IDs
      const documentIds = request.uploadedDocuments.map(doc => doc.id);

      // Search for similar chunks
      const searchResults = ragService.searchSimilarChunks(queryEmbedding, documentIds, 5);
      console.log(`[Chat Service] Found ${searchResults.length} relevant chunks`);

      // Format results as context
      if (searchResults.length > 0) {
        contextText = ragService.formatContextFromResults(searchResults);
        console.log('[Chat Service] Using RAG context instead of full document');

        // Store retrieved chunks for display in UI
        retrievedChunks = searchResults.map(result => ({
          text: result.chunk.text,
          similarity: result.similarity,
          chunkIndex: result.chunk.chunkIndex
        }));
      } else {
        // Fallback to full document if no chunks found
        console.warn('[Chat Service] No chunks found, using full document text');
      }
    }

    // Call Gemini with RAG-enhanced context
    const geminiResponse = await geminiService.processChatWithDocument(
      request.content,
      contextText,
      chatHistory,
      request.domain || 'general'
    );

    console.log('[Chat Service] Gemini response type:', geminiResponse.responseType);

    // Handle different response types
    if (geminiResponse.responseType === 'simple') {
      // Simple conversational response
      const aiMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        content: geminiResponse.message,
        sender: 'assistant',
        timestamp: new Date(),
        domain: request.domain as LegalDomain,
        type: 'text',
        retrievedChunks: retrievedChunks.length > 0 ? retrievedChunks : undefined,
      };

      console.log('[Chat Service] Simple message response');

      return {
        message: userMessage,
        aiResponse: aiMessage,
      };
    }

    if (geminiResponse.responseType === 'final') {
      // 3-tab legal analysis
      const aiMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        content: geminiResponse.systemMessage || 'Here\'s my analysis.',
        sender: 'assistant',
        timestamp: new Date(),
        domain: request.domain as LegalDomain,
        type: 'text',
        retrievedChunks: retrievedChunks.length > 0 ? retrievedChunks : undefined,
      };

      console.log('[Chat Service] 3-tab response');
      console.log('[Chat Service] Explanation:', !!geminiResponse.explanation);
      console.log('[Chat Service] Analysis risks:', geminiResponse.analysis?.risks?.length || 0);
      console.log('[Chat Service] Actions:', geminiResponse.actions?.length || 0);

      return {
        message: userMessage,
        aiResponse: aiMessage,
        supervisorData: {
          response_type: 'final',
          system_message: geminiResponse.systemMessage,
          explanation: geminiResponse.explanation,
          analysis: geminiResponse.analysis,
          actions: geminiResponse.actions,
        },
      };
    }

    // Fallback: treat as simple message
    const aiMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      content: typeof geminiResponse === 'string' ? geminiResponse : 'Response received.',
      sender: 'assistant',
      timestamp: new Date(),
      domain: request.domain as LegalDomain,
      type: 'text',
      retrievedChunks: retrievedChunks.length > 0 ? retrievedChunks : undefined,
    };

    return {
      message: userMessage,
      aiResponse: aiMessage,
    };
  } catch (error) {
    console.error('[Chat Service] Send message failed:', error);

    // Return user message with error
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: request.content,
      sender: 'user',
      timestamp: new Date(),
      domain: request.domain as LegalDomain,
      type: 'text',
    };

    const errorMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      content: 'Sorry, I encountered an error processing your request. Please try again.',
      sender: 'assistant',
      timestamp: new Date(),
      domain: request.domain as LegalDomain,
      type: 'text',
    };

    return {
      message: userMessage,
      aiResponse: errorMessage,
    };
  }
}

/**
 * Get document text from localStorage by document ID
 */
export function getDocumentText(documentId: string): string | null {
  try {
    // Get document text directly from documents storage (no file blobs needed)
    const documents = JSON.parse(localStorage.getItem('legalkaki_documents') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = documents.find((doc: any) => doc.id === documentId);

    if (document && document.contentText) {
      return document.contentText;
    }

    console.warn('[Chat Service] Document text not found:', documentId);
    return null;
  } catch (error) {
    console.error('[Chat Service] Error getting document text:', error);
    return null;
  }
}

/**
 * Generate draft document
 * Creates a document with Gemini-generated content and stores it in localStorage
 */
export async function generateDraft(
  prompt: string,
  title: string,
  domain: string,
  context?: string
): Promise<{ success: boolean; document?: Document; error?: string }> {
  try {
    console.log('[Chat Service] Generating draft:', title);

    // Generate content using Gemini
    const content = await geminiService.generateDraftDocument(prompt, title, domain, context);

    // Create document metadata
    const documentId = `doc_draft_${Date.now()}`;
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    const fileSize = new Blob([content], { type: 'text/plain' }).size;

    // Store in localStorage (only metadata and text, no binary blob)
    const documentMetadata: Document = {
      id: documentId,
      originalFilename: filename,
      storedFilename: filename,
      fileType: 'text/plain',
      fileSize,
      uploadDate: new Date(),
      analysisStatus: 'completed',
      s3Key: `drafts/${documentId}`,
      s3Bucket: 'local-storage',
      contentText: content,
    };

    // Add to documents list (no file blob storage needed)
    addDocument(documentMetadata);

    console.log('[Chat Service] Draft created:', documentId);

    return {
      success: true,
      document: documentMetadata,
    };
  } catch (error) {
    console.error('[Chat Service] Error generating draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate draft',
    };
  }
}

/**
 * Chat Service Export
 */
export const chatService = {
  uploadDocument,
  sendMessage,
  getDocumentText,
  generateDraft,
};

export default chatService;
