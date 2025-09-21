import { bedrockService } from "./bedrockService";
import {
  UploadDocumentResponse,
  SendMessageResponse,
  AnalysisResult,
  DraftResult,
} from "./types";
import { Document } from "@/types";
import { mockClient } from "./mockClient";

// Structured response interface for mode detection
interface StructuredResponse {
  Mode: "A" | "B" | "C";
  answer: string;
  steps?: string[];
  source?: string;
  // Accept extra fields from backend like "Explanation", "Relevant Facts", etc.
  [key: string]: unknown;
}

// Mode switching information
interface ModeSwitch {
  detected: boolean;
  mode: "A" | "B" | "C" | null;
  toDraftMode: boolean;
  toAnalysisMode: boolean;
  structuredData?: StructuredResponse;
}

// Backend API configuration
const BACKEND_CONFIG = {
  baseUrl: "http://43.217.133.28",
  endpoints: {
    uploadDocument:
      "/api/v1/datasets/1e99cdde96d611f08ce90242ac120005/documents",
    chatCompletions:
      "/api/v1/chats_openai/13dfe97696dd11f0a6b70242ac130005/chat/completions",
  },
  auth: {
    token: "ragflow-E1YWMxNmU4OTZkNTExZjBiNzUwMDI0Mm", // Backend authorization token
  },
  // Connection timeout settings
  timeout: {
    upload: 30000, // 30 seconds for uploads
    chat: 60000, // 60 seconds for chat completion
    connection: 10000, // 10 seconds for initial connection
  },
};

// Document upload API response type from backend
interface BackendUploadResponse {
  code: number;
  message?: string;
  data?: Array<{
    chunk_method: string;
    created_by: string;
    dataset_id: string;
    id: string;
    location: string;
    name: string;
    parser_config: { pages: number[][] };
    run: string;
    size: number;
    suffix: string;
    thumbnail: string;
    type: string;
  }>;
}

// Chat completion chunk format from backend
interface ChatCompletionChunk {
  id: string;
  choices: Array<{
    delta: {
      content: string | null;
      role: string;
      function_call: null;
      tool_calls: null;
      reasoning_content: null;
    };
    finish_reason: string | null;
    index: number;
    logprobs: null;
  }>;
  created: number;
  model: string;
  object: string;
  system_fingerprint: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
}

export class RealApiClient {
  private baseUrl: string;
  private authToken: string;

  constructor() {
    this.baseUrl = BACKEND_CONFIG.baseUrl;
    this.authToken = BACKEND_CONFIG.auth.token;

    // Log configuration for debugging
    console.log("RealApiClient initialized with:");
    console.log("Base URL:", this.baseUrl);
    console.log("Auth token:", this.authToken);
    console.log(
      "Upload endpoint:",
      `${this.baseUrl}${BACKEND_CONFIG.endpoints.uploadDocument}`
    );
    console.log(
      "Chat endpoint:",
      `${this.baseUrl}${BACKEND_CONFIG.endpoints.chatCompletions}`
    );
  }

  // Test both endpoints connectivity
  async testEndpoints(): Promise<{ upload: boolean; chat: boolean }> {
    const results = { upload: false, chat: false };

    try {
      // Test upload endpoint
      const uploadResponse = await fetch(
        `${this.baseUrl}${BACKEND_CONFIG.endpoints.uploadDocument}`,
        {
          method: "OPTIONS", // Use OPTIONS to test CORS and endpoint existence
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      results.upload = uploadResponse.status < 500; // Any status < 500 means endpoint exists
      console.log(
        `Upload endpoint test: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    } catch (error) {
      console.warn("Upload endpoint test failed:", error);
    }

    try {
      // Test chat endpoint
      const chatResponse = await fetch(
        `${this.baseUrl}${BACKEND_CONFIG.endpoints.chatCompletions}`,
        {
          method: "OPTIONS", // Use OPTIONS to test CORS and endpoint existence
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      results.chat = chatResponse.status < 500; // Any status < 500 means endpoint exists
      console.log(
        `Chat endpoint test: ${chatResponse.status} ${chatResponse.statusText}`
      );
    } catch (error) {
      console.warn("Chat endpoint test failed:", error);
    }

    return results;
  }

  // Test backend connectivity using the actual upload endpoint
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple HEAD request to the upload endpoint
      const testResponse = await fetch(
        `${this.baseUrl}${BACKEND_CONFIG.endpoints.uploadDocument}`,
        {
          method: "HEAD",
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        }
      );

      // For upload endpoint, we expect either 200, 405 (method not allowed), or 401 (auth issue)
      // 404 would indicate the endpoint doesn't exist
      const isConnectionOk = testResponse.status !== 404;
      console.log(
        `Connection test result: ${testResponse.status} ${testResponse.statusText}`
      );
      return isConnectionOk;
    } catch (error) {
      console.warn("Backend connectivity test failed:", error);
      return false;
    }
  }

  // Upload document with FormData
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadDocumentResponse> {
    // First test backend connectivity
    const endpointTests = await this.testEndpoints();
    console.log("Endpoint test results:", endpointTests);

    if (!endpointTests.upload) {
      console.warn(
        "Upload endpoint not available, falling back to mock client"
      );
      return this.fallbackToMockUpload(file, onProgress);
    }

    const formData = new FormData();
    // Use the exact field name from API documentation
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Set timeout
      xhr.timeout = BACKEND_CONFIG.timeout.upload;

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(Math.round(progress));
          }
        });
      }

      xhr.onload = () => {
        console.log("Upload response received:", {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText,
        });

        if (xhr.status === 200) {
          try {
            const response: BackendUploadResponse = JSON.parse(
              xhr.responseText
            );
            console.log("Parsed response:", response);

            if (
              response.code === 0 &&
              response.data &&
              response.data.length > 0
            ) {
              const uploadedDoc = response.data[0];

              // Transform backend response to our format
              const document = {
                id: uploadedDoc.id,
                originalFilename: uploadedDoc.name,
                storedFilename: uploadedDoc.location,
                fileType: `application/${uploadedDoc.suffix}`,
                fileSize: uploadedDoc.size,
                s3Bucket: "", // Not provided in backend response
                s3Key: uploadedDoc.location,
                uploadDate: new Date(),
                analysisStatus: (uploadedDoc.run === "UNSTART"
                  ? "pending"
                  : "completed") as "pending" | "completed",
              };

              resolve({
                document,
                uploadUrl: `${this.baseUrl}/${uploadedDoc.location}`,
                analysisJobId: uploadedDoc.id,
              });
            } else {
              // Enhanced error handling with more specific messages
              const errorMessage = this.getUploadErrorMessage(
                response.code,
                response
              );
              console.error("Upload failed with response:", response);

              // For certain error codes, try fallback to mock
              if (response.code >= 100 && response.code <= 115) {
                console.warn(
                  `Backend error ${response.code}, falling back to mock client`
                );
                this.fallbackToMockUpload(file, onProgress)
                  .then(resolve)
                  .catch(reject);
                return;
              }

              reject(new Error(errorMessage));
            }
          } catch (error) {
            console.error(
              "JSON parse error:",
              error,
              "Response:",
              xhr.responseText
            );
            reject(
              new Error(`Upload failed: Invalid JSON response - ${error}`)
            );
          }
        } else {
          console.error(
            "HTTP error:",
            xhr.status,
            xhr.statusText,
            xhr.responseText
          );
          reject(
            new Error(`Upload failed: HTTP ${xhr.status} - ${xhr.statusText}`)
          );
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed: Network connection error"));
      };

      xhr.ontimeout = () => {
        reject(new Error("Upload failed: Request timeout"));
      };

      const uploadUrl = `${this.baseUrl}${BACKEND_CONFIG.endpoints.uploadDocument}`;
      console.log("Uploading to:", uploadUrl);
      console.log("Auth token:", this.authToken);
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${this.authToken}`);

      try {
        xhr.send(formData);
      } catch (error) {
        console.error("XHR send error:", error);
        reject(new Error(`Upload failed: ${error}`));
      }
    });
  }

  // Send message with streaming response
  async sendMessage(
    content: string,
    messageType: "text" | "analysis_request" | "draft_request" = "text",
    onProgress?: (content: string) => void
  ): Promise<SendMessageResponse> {
    // First test backend connectivity
    const endpointTests = await this.testEndpoints();
    console.log("Endpoint test results for chat:", endpointTests);

    if (!endpointTests.chat) {
      console.warn("Chat endpoint not available, falling back to mock");
      throw new Error(
        "Chat endpoint not available - will fallback to mock in endpoints.ts"
      );
    }
    const requestBody = {
      model:
        "arn:aws:bedrock:us-east-1:063867200503:inference-profile/us.meta.llama3-3-70b-instruct-v1:0",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      stream: true,
    };

    const chatUrl = `${this.baseUrl}${BACKEND_CONFIG.endpoints.chatCompletions}`;
    console.log("Sending chat request to:", chatUrl);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    console.log("Auth token:", this.authToken);

    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Chat response status:", response.status, response.statusText);
    console.log(
      "Chat response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Chat API error response:", errorText);
      throw new Error(
        `Chat API failed: HTTP ${response.status} - ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("Chat API failed: No response body");
    }

    // Parse streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const dataContent = line.slice(5).trim();

            // Check for end of stream
            if (dataContent === "[DONE]") {
              console.log("[RealApiClient] stream complete");
              break;
            }

            try {
              const chunk: ChatCompletionChunk = JSON.parse(dataContent);

              if (chunk.choices && chunk.choices.length > 0) {
                const delta = chunk.choices[0].delta;

                if (delta.content) {
                  accumulatedContent += delta.content;
                  // Debug: log chunk delta and preview
                  try {
                    console.log("[RealApiClient] chunk delta:", delta.content);
                    if (/\"Mode\"\s*:\s*\"[ABC]\"/.test(accumulatedContent)) {
                      console.log(
                        "[RealApiClient] Mode markers detected in stream"
                      );
                    }
                  } catch (_) {}

                  // Call progress callback with accumulated content
                  if (onProgress) {
                    onProgress(accumulatedContent);
                  }
                }
              }
            } catch (parseError) {
              console.warn("Failed to parse chunk:", dataContent, parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Process the accumulated content based on message type
    const processedResponse = await this.processAccumulatedContent(
      accumulatedContent,
      messageType,
      content
    );

    // Debug: log processed response summary for rendering
    try {
      console.log("[RealApiClient] Processed chat response summary:", {
        requestedMessageType: messageType,
        accumulatedContentLength: accumulatedContent?.length || 0,
        aiResponseType: processedResponse.aiResponse?.type,
        hasAnalysisResult: Boolean(processedResponse.analysisResult),
        hasDraftResult: Boolean(processedResponse.draftResult),
        modeSwitch: processedResponse.modeSwitch || null,
      });
    } catch (e) {
      // noop
    }

    return processedResponse;
  }

  // Parse structured JSON response and detect mode switching
  private parseStructuredResponse(content: string): ModeSwitch {
    try {
      // Try to parse as JSON
      const jsonResponse: StructuredResponse = JSON.parse(content);

      if (jsonResponse.Mode && ["A", "B", "C"].includes(jsonResponse.Mode)) {
        const isAnalysisMode = ["A", "B"].includes(jsonResponse.Mode);
        const isDraftMode = jsonResponse.Mode === "C";

        console.log(
          `Detected structured response with Mode: ${jsonResponse.Mode}`
        );
        console.log(`Switching to: ${isDraftMode ? "Draft" : "Analysis"} mode`);

        return {
          detected: true,
          mode: jsonResponse.Mode,
          toDraftMode: isDraftMode,
          toAnalysisMode: isAnalysisMode,
          structuredData: jsonResponse,
        };
      }
    } catch (error) {
      // Not a JSON response or doesn't have Mode field - that's fine
      console.log("Response is not structured JSON or missing Mode field");
    }

    return {
      detected: false,
      mode: null,
      toDraftMode: false,
      toAnalysisMode: false,
    };
  }

  // Parse all structured JSON responses containing a Mode field within the content
  private parseAllStructuredResponses(content: string): StructuredResponse[] {
    const results: StructuredResponse[] = [];
    try {
      // Find potential JSON blocks that contain a Mode field
      const jsonLikeRegex = /\{[\s\S]*?\}/g;
      const matches = content.match(jsonLikeRegex) || [];
      for (const candidate of matches) {
        try {
          const parsed = JSON.parse(candidate);
          if (
            parsed &&
            typeof parsed === "object" &&
            parsed.Mode &&
            ["A", "B", "C"].includes(parsed.Mode)
          ) {
            results.push(parsed as StructuredResponse);
          }
        } catch (_) {
          // ignore
        }
      }
    } catch (_) {}
    return results;
  }

  // Format structured response for better display
  private formatStructuredResponse(structured: StructuredResponse): string {
    // Prefer flexible fields from backend. Fall back to generic 'answer'
    const title =
      this.getStringField(structured, "Explanation") || structured.answer || "";
    const facts: string[] = this.getStringArrayField(
      structured,
      "Relevant Facts"
    );
    const steps: string[] = Array.isArray(structured.steps)
      ? structured.steps
      : [];
    const note: string | undefined = this.getStringField(structured, "Note");
    const source: string | undefined = structured.source as string | undefined;

    let formatted = "";
    if (title) {
      formatted += `**${title}**\n\n`;
    }
    if (facts.length > 0) {
      formatted += "**Relevant Facts:**\n";
      facts.forEach((f, i) => {
        formatted += `- ${f}\n`;
      });
      formatted += "\n";
    }
    if (steps.length > 0) {
      formatted += "**Steps:**\n";
      steps.forEach((s, i) => {
        formatted += `${i + 1}. ${s}\n`;
      });
      formatted += "\n";
    }
    if (note) {
      formatted += `> ${note}\n\n`;
    }
    if (source) {
      formatted += `*Source: ${source}*`;
    }
    return formatted.trim();
  }

  // Remove simple HTML tags to plain text for UI
  private sanitizeToPlainText(input: string | undefined): string {
    if (!input) return "";
    try {
      return String(input)
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .trim();
    } catch {
      return String(input);
    }
  }

  // Typed safe getters for flexible backend fields
  private getStringField(
    obj: StructuredResponse,
    key: string
  ): string | undefined {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "string" ? v : undefined;
  }
  private getStringArrayField(obj: StructuredResponse, key: string): string[] {
    const v = (obj as Record<string, unknown>)[key];
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === "string");
    }
    return [];
  }

  private analysisFromStructured(
    structured: StructuredResponse,
    originalQuery: string
  ): AnalysisResult {
    const explanation = this.sanitizeToPlainText(
      this.getStringField(structured, "Explanation") || structured.answer || ""
    );
    const relevantFacts: string[] = this.getStringArrayField(
      structured,
      "Relevant Facts"
    );
    const steps: string[] = Array.isArray(structured.steps)
      ? structured.steps
      : [];

    const keyPoints: string[] = [];
    keyPoints.push(...relevantFacts.map((f) => this.sanitizeToPlainText(f)));
    if (keyPoints.length === 0)
      keyPoints.push(...steps.map((s) => this.sanitizeToPlainText(s)));

    return {
      id: `analysis_${Date.now()}`,
      explanation: explanation || this.sanitizeToPlainText(originalQuery),
      risks: [
        {
          level: "medium",
          description: "AI-generated analysis requires professional review",
          recommendation:
            "Consult with a qualified lawyer for specific legal advice",
          urgency: 5,
        },
      ],
      keyPoints: keyPoints.slice(0, 8),
      actionItems: [],
      confidence: 0.75,
      processingTime: 2.0,
    };
  }

  private draftFromStructured(structured: StructuredResponse): DraftResult {
    const title = this.sanitizeToPlainText(
      structured.answer ||
        this.getStringField(structured, "Explanation") ||
        "Draft"
    );
    const steps: string[] = Array.isArray(structured.steps)
      ? structured.steps
      : [];
    const body = steps
      .map((s, i) => `${i + 1}. ${this.sanitizeToPlainText(s)}`)
      .join("\n");
    const content = title ? `**${title}**\n\n${body}` : body;
    return {
      id: `draft_${Date.now()}`,
      documentType: "Legal Document",
      content: content.trim(),
      suggestions: [
        {
          section: "Review Required",
          suggestion:
            "Verify the draft against the latest Malaysian regulations",
          priority: "high",
          reasoning: "Ensure compliance with current law",
        },
      ],
      disclaimer:
        "This is an AI-generated draft. Please have it reviewed by a qualified lawyer before use.",
      templateUsed: "AI Generated Template",
    };
  }

  // Process accumulated content using existing parsing functions
  private async processAccumulatedContent(
    accumulatedContent: string,
    messageType: "text" | "analysis_request" | "draft_request",
    originalQuery: string
  ): Promise<SendMessageResponse> {
    const now = new Date();

    // First, check for structured response and mode switching
    const modeSwitch = this.parseStructuredResponse(accumulatedContent);
    // Also parse all structured responses to detect multiple modes in one stream
    const allStructured = this.parseAllStructuredResponses(accumulatedContent);

    // If we have structured data, format it nicely for display
    let displayContent = accumulatedContent;
    if (modeSwitch.detected && modeSwitch.structuredData) {
      const structured = modeSwitch.structuredData;
      displayContent = this.formatStructuredResponse(structured);
    }

    // Create user message
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: originalQuery,
      sender: "user" as const,
      timestamp: now,
    };

    // Determine final response type based on detected Mode or requested messageType
    let finalResponseType: "text" | "analysis" | "draft" = "text";
    if (modeSwitch.detected) {
      finalResponseType = modeSwitch.toDraftMode ? "draft" : "analysis";
    } else {
      finalResponseType =
        messageType === "analysis_request"
          ? "analysis"
          : messageType === "draft_request"
          ? "draft"
          : "text";
    }

    // Create AI response message with formatted content
    const aiResponse = {
      id: `msg_${Date.now() + 1}`,
      content: displayContent,
      sender: "assistant" as const,
      timestamp: new Date(now.getTime() + 1000),
      type: finalResponseType,
    };

    let analysisResult: AnalysisResult | undefined;
    let draftResult: DraftResult | undefined;

    try {
      // If any Mode A/B present anywhere in stream, produce analysis result
      const hasAnalysisMode = allStructured.some(
        (s) => s.Mode === "A" || s.Mode === "B"
      );
      const hasDraftMode = allStructured.some((s) => s.Mode === "C");

      if (finalResponseType === "analysis" || hasAnalysisMode) {
        // Use existing parsing functions from bedrockService
        const structuredForAnalysis = allStructured.find(
          (s) => s.Mode === "A" || s.Mode === "B"
        );
        if (structuredForAnalysis) {
          analysisResult = this.analysisFromStructured(
            structuredForAnalysis,
            originalQuery
          );
        } else {
          const parsedAnalysis = bedrockService["parseAnalysisResponse"](
            accumulatedContent,
            originalQuery
          );
          analysisResult = {
            id: `analysis_${Date.now()}`,
            explanation: parsedAnalysis.explanation,
            risks: [
              {
                level: "medium",
                description:
                  "AI-generated analysis requires professional review",
                recommendation:
                  "Consult with a qualified lawyer for specific legal advice",
                urgency: 5,
              },
            ],
            keyPoints: this.extractKeyPoints(accumulatedContent),
            actionItems: [],
            confidence: parsedAnalysis.confidence / 100,
            processingTime: 2.0,
          };
        }
      }

      // If any Mode C present, extract draft as well
      if (finalResponseType === "draft" || hasDraftMode) {
        // Extract draft content and suggestions
        const structuredForDraft = allStructured.find((s) => s.Mode === "C");
        if (structuredForDraft) {
          draftResult = this.draftFromStructured(structuredForDraft);
        } else {
          draftResult = this.extractDraftResult(accumulatedContent);
        }
      }
    } catch (error) {
      console.error("Error processing response:", error);
      // Fallback: clean up the content using existing functions
      const cleanedContent =
        bedrockService["cleanupResponse"](accumulatedContent);
      aiResponse.content = cleanedContent;
    }

    return {
      message: userMessage,
      aiResponse,
      analysisResult,
      draftResult,
      modeSwitch: modeSwitch.detected
        ? {
            detected: modeSwitch.detected,
            mode: modeSwitch.mode,
            toDraftMode: modeSwitch.toDraftMode,
            toAnalysisMode: modeSwitch.toAnalysisMode,
            structuredData: modeSwitch.structuredData,
          }
        : undefined,
    };
  }

  // Extract key points from response content
  private extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = [];

    // Look for bullet points, numbered lists, or "key points" sections
    const bulletPointRegex = /[•\-\*]\s*([^\n]+)/gi;
    const numberedListRegex = /\d+\.\s*([^\n]+)/gi;

    let match;
    while ((match = bulletPointRegex.exec(content)) !== null) {
      keyPoints.push(match[1].trim());
    }

    while ((match = numberedListRegex.exec(content)) !== null) {
      keyPoints.push(match[1].trim());
    }

    // If no structured points found, extract sentences with key terms
    if (keyPoints.length === 0) {
      const sentences = content.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (
          sentence.includes("important") ||
          sentence.includes("required") ||
          sentence.includes("must") ||
          sentence.includes("should")
        ) {
          keyPoints.push(sentence.trim());
        }
      }
    }

    return keyPoints.slice(0, 5); // Limit to 5 key points
  }

  // Extract draft result from response content
  private extractDraftResult(content: string): DraftResult {
    // Look for structured draft content
    const draftMatch = content.match(/\*\*.*DRAFT.*\*\*([\s\S]*?)(?:\*\*|$)/i);
    const draftContent = draftMatch ? draftMatch[1].trim() : content;

    // Clean up the content
    const cleanedContent = bedrockService["cleanupResponse"](draftContent);

    return {
      id: `draft_${Date.now()}`,
      documentType: "Legal Document",
      content: cleanedContent,
      suggestions: [
        {
          section: "Review Required",
          suggestion: "AI-generated draft requires professional legal review",
          priority: "high",
          reasoning: "Ensure compliance with current Malaysian law",
        },
      ],
      disclaimer:
        "This is an AI-generated draft. Please have it reviewed by a qualified lawyer before use.",
      templateUsed: "AI Generated Template",
    };
  }

  // Get user-friendly error message based on backend error code
  private getUploadErrorMessage(
    code: number,
    response: BackendUploadResponse
  ): string {
    const errorMessages: { [key: number]: string } = {
      0: "Upload successful",
      100: "File too large - Please upload a file smaller than 10MB",
      101: "Unsupported file type - Please upload PDF, DOC, or DOCX files only",
      102: "File corrupted - Please check your file and try again",
      103: "Server temporarily unavailable - Please try again in a few minutes",
      104: "Authentication failed - Please refresh the page and try again",
      105: "Storage quota exceeded - Please contact support",
      106: "File already exists - Please rename your file or choose a different one",
      107: "Invalid file format - The file appears to be corrupted or invalid",
      108: "Processing timeout - File is too complex, please try a simpler document",
      109: "Dataset not found or access denied - Please contact support or try again later",
      110: "File processing failed - The document could not be processed, please try a different file",
      111: "Network timeout - Please check your connection and try again",
      112: "Server overloaded - Please try again in a few minutes",
      113: "Invalid request format - Please refresh the page and try again",
      114: "File size limit exceeded - Please upload a smaller file",
      115: "Unsupported file encoding - Please save your file in a different format",
    };

    const baseMessage =
      errorMessages[code] || `Upload failed with error code ${code}`;

    // Add additional context if available
    if (response && response.message) {
      return `${baseMessage} (${response.message})`;
    }

    return baseMessage;
  }

  // Fallback to mock client when backend fails
  private async fallbackToMockUpload(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadDocumentResponse> {
    console.log("Using mock client for upload fallback");

    // Simulate progress if callback provided
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress(i);
      }
    }

    // Use mock client to generate a response
    const mockResponse = await mockClient.uploadFile(file, onProgress);

    if (!mockResponse.success) {
      throw new Error("Mock upload failed");
    }

    // Transform mock response to match UploadDocumentResponse format
    const document: Document = {
      id: mockResponse.data.fileId,
      originalFilename: file.name,
      storedFilename: file.name,
      fileType: file.type,
      fileSize: file.size,
      s3Bucket: "mock-bucket",
      s3Key: mockResponse.data.fileId,
      uploadDate: new Date(),
      analysisStatus: "pending" as const,
    };

    return {
      document,
      uploadUrl: mockResponse.data.url,
      analysisJobId: mockResponse.data.fileId,
    };
  }
}

// Manual test function for debugging
export async function debugApiConnection() {
  console.log("=== API Connection Debug ===");

  const client = new RealApiClient();

  // Test endpoints
  const endpointResults = await client.testEndpoints();
  console.log("Endpoint availability:", endpointResults);

  // Test simple fetch to base URL
  try {
    const baseResponse = await fetch(BACKEND_CONFIG.baseUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    console.log(
      `Base URL (${BACKEND_CONFIG.baseUrl}) response:`,
      baseResponse.status,
      baseResponse.statusText
    );
  } catch (error) {
    console.error("Base URL test failed:", error);
  }

  // Test specific upload endpoint with GET (just to see if it exists)
  try {
    const uploadTestResponse = await fetch(
      `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.uploadDocument}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${BACKEND_CONFIG.auth.token}` },
        signal: AbortSignal.timeout(5000),
      }
    );
    console.log(
      `Upload endpoint test response:`,
      uploadTestResponse.status,
      uploadTestResponse.statusText
    );
  } catch (error) {
    console.error("Upload endpoint test failed:", error);
  }

  // Test specific chat endpoint with GET (just to see if it exists)
  try {
    const chatTestResponse = await fetch(
      `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.endpoints.chatCompletions}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${BACKEND_CONFIG.auth.token}` },
        signal: AbortSignal.timeout(5000),
      }
    );
    console.log(
      `Chat endpoint test response:`,
      chatTestResponse.status,
      chatTestResponse.statusText
    );
  } catch (error) {
    console.error("Chat endpoint test failed:", error);
  }

  console.log("=== Debug Complete ===");
  return endpointResults;
}

// Export singleton instance
export const realApiClient = new RealApiClient();
export default realApiClient;

// Make debug function globally available in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  type DevWindow = typeof window & {
    debugApiConnection: () => Promise<{ upload: boolean; chat: boolean }>;
    realApiClient: RealApiClient;
  };
  const w = window as DevWindow;
  w.debugApiConnection = debugApiConnection;
  w.realApiClient = realApiClient;
  console.log(
    "Debug functions available: window.debugApiConnection(), window.realApiClient"
  );
}
