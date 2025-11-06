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
import { fileToBase64, addFileBlob, addDocument, getFileBlob } from '@/lib/localStorage-utils';
import { geminiService } from './geminiService';
import type {
  UploadDocumentResponse,
  SendMessageRequest,
  SendMessageResponse,
  AnalysisResult,
} from './types';
import type { Message, LegalDomain, Document } from '@/types';

/**
 * Upload a document (PDF) for chat
 * Stores in localStorage, extracts text client-side
 */
export async function uploadDocument(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadDocumentResponse> {
  try {
    console.log('[Chat Service] Uploading document:', file.name);

    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    // Step 1: Extract text from PDF (10-90% progress)
    onProgress?.(10);
    const extractionResult = await extractTextFromPDF(file, (extractProgress) => {
      // Map extraction progress to 10-90%
      const mappedProgress = 10 + (extractProgress * 0.8);
      onProgress?.(Math.round(mappedProgress));
    });

    console.log('[Chat Service] Extraction result:', extractionResult);

    // Step 2: Convert file to base64 for storage
    onProgress?.(90);
    const base64Data = await fileToBase64(file);

    // Step 3: Generate document ID
    const documentId = `doc_${Date.now()}`;

    // Step 4: Store file in localStorage
    addFileBlob(documentId, file.name, file.type, base64Data);

    // Step 5: Store document metadata with extracted text
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
      contentText: cleanPDFText(extractionResult.text),
      contentSummary: `PDF document with ${extractionResult.pageCount} pages`,
      metadata: {
        pages: extractionResult.pageCount,
        title: extractionResult.metadata?.title,
        author: extractionResult.metadata?.author,
        extractedTextLength: extractionResult.text.length,
      },
    };

    addDocument(documentMetadata);

    console.log('[Chat Service] Document uploaded successfully:', {
      id: documentId,
      pages: extractionResult.pageCount,
      textLength: extractionResult.text.length,
    });

    onProgress?.(100);

    return {
      document: documentMetadata,
      uploadUrl: `local-storage://${documentId}`, // Mock URL
    };
  } catch (error) {
    console.error('[Chat Service] Upload failed:', error);
    throw error;
  }
}

/**
 * Send a message in chat with document context
 * Calls Gemini Flash directly, no backend
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

    // Call Gemini with document context
    const geminiResponse = await geminiService.processChatWithDocument(
      request.content,
      documentText || '',
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
    const fileBlob = getFileBlob(documentId);
    if (!fileBlob) {
      console.warn('[Chat Service] Document not found:', documentId);
      return null;
    }

    // Note: The actual text is stored in the document metadata, not the file blob
    // We'll need to get it from the documents storage
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
    const blob = new Blob([content], { type: 'text/plain' });
    const fileSize = blob.size;

    // Convert to base64 for storage
    const base64Data = btoa(content);

    // Store in localStorage
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

    // Add to documents list
    const { addDocument, addFileBlob } = await import('@/lib/localStorage-utils');
    addDocument(documentMetadata);
    addFileBlob(documentId, filename, 'text/plain', base64Data);

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
