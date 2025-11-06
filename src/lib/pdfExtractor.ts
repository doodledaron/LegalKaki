/**
 * PDF Text Extractor for POC
 *
 * Extracts text content from PDF files using pdfjs-dist.
 * Runs entirely in the browser, no backend needed.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
if (typeof window !== 'undefined') {
  // Use version-matched worker from npm package
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
}

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
}

/**
 * Extract text from a PDF file
 * @param file PDF file to extract text from
 * @param onProgress Optional callback for progress updates (0-100)
 * @returns Extracted text and metadata
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: number) => void
): Promise<PDFExtractionResult> {
  try {
    console.log('[PDF Extractor] Starting text extraction from:', file.name);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(10);

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    onProgress?.(30);

    console.log('[PDF Extractor] PDF loaded, pages:', pdf.numPages);

    // Extract text from all pages
    const textPromises: Promise<string>[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      textPromises.push(
        pdf.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => item.str)
            .join(' ');

          // Update progress
          const progress = 30 + ((pageNum / pdf.numPages) * 60);
          onProgress?.(Math.round(progress));

          return pageText;
        })
      );
    }

    // Wait for all pages to be processed
    const pageTexts = await Promise.all(textPromises);
    const fullText = pageTexts.join('\n\n').trim();

    onProgress?.(95);

    // Extract metadata
    const metadata = await pdf.getMetadata();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info = metadata?.info as any;

    console.log('[PDF Extractor] Extraction complete, text length:', fullText.length);
    onProgress?.(100);

    return {
      text: fullText,
      pageCount: pdf.numPages,
      metadata: {
        title: info?.Title || file.name,
        author: info?.Author,
        subject: info?.Subject,
        creator: info?.Creator,
      },
    };
  } catch (error) {
    console.error('[PDF Extractor] Error extracting text:', error);
    throw new Error('Failed to extract text from PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Truncate text to a maximum length for API calls
 * @param text Text to truncate
 * @param maxLength Maximum length in characters
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 100000): string {
  if (text.length <= maxLength) {
    return text;
  }

  console.warn('[PDF Extractor] Text truncated from', text.length, 'to', maxLength, 'characters');

  // Truncate and add notice
  return text.substring(0, maxLength) + '\n\n[... Text truncated due to length. Only first part shown ...]';
}

/**
 * Clean extracted PDF text (remove excessive whitespace, etc.)
 * @param text Raw extracted text
 * @returns Cleaned text
 */
export function cleanPDFText(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/ +/g, ' ')
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove leading/trailing whitespace
    .trim();
}
