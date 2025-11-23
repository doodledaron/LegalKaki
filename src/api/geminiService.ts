/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Gemini AI Service for LegalKaki POC
 *
 * This service uses Google's Gemini API for all AI features.
 * All original prompts from Bedrock are maintained but routed to Gemini.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Types for AI service
export interface TextAnalysisRequest {
  selectedText: string;
  context?: string;
  documentType?: string;
  pageNumber?: number;
}

export interface TextAnalysisResponse {
  explanation: string;
  category:
  | "clause"
  | "legal-term"
  | "obligation"
  | "right"
  | "warning"
  | "general";
  confidence: number;
}

export interface MindMapAnalysisRequest {
  collectionTitle: string;
  collectionDomain: string;
  collectionSummary: string;
  conversations: Array<{
    id: string;
    title: string;
    domain: string;
    messages: unknown[];
  }>;
  documents: Array<{
    id: string;
    originalFilename: string;
    contentSummary?: string;
  }>;
  actionItems: Array<{
    id: string;
    title: string;
    description: string;
    priority: "urgent" | "important" | "normal";
    status: "pending" | "in_progress" | "completed";
  }>;
}

export interface MindMapInsights {
  keyThemes: Array<{
    id: string;
    name: string;
    description: string;
    importance: "high" | "medium" | "low";
    relatedItems: Array<{
      type: "document" | "conversation" | "action";
      id: string;
      title: string;
    }>;
  }>;
  urgentActions: Array<{
    id: string;
    title: string;
    reasoning: string;
    suggestedDeadline: string;
  }>;
  riskFactors: Array<{
    description: string;
    severity: "high" | "medium" | "low";
    affectedItems: string[];
  }>;
  recommendations: string[];
  connections: Array<{
    fromId: string;
    toId: string;
    relationship: string;
    strength: number;
  }>;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  private embeddingModel: any = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('⚠️ [Gemini Service] No API key found - using mock responses');
      console.warn('⚠️ Add your Gemini API key to .env.local as NEXT_PUBLIC_GEMINI_API_KEY');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use Gemini Flash (1.5) for faster and cheaper responses
      const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-1.5-flash";
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      // Initialize embedding model for RAG
      this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
      console.log(`✅ [Gemini Service] Initialized successfully with ${modelName} and text-embedding-004`);
    } catch (error) {
      console.error('❌ [Gemini Service] Failed to initialize:', error);
    }
  }

  /**
   * Analyze legal text using Gemini API
   */
  async analyzeText(request: TextAnalysisRequest): Promise<TextAnalysisResponse> {
    console.log('[Gemini Service] Analyzing text...');

    // If no API key, return mock response
    if (!this.model) {
      console.log('[Gemini Service] Using mock response (no API key)');
      return this.fallbackAnalysis(request.selectedText);
    }

    try {
      const prompt = this.buildLegalAnalysisPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('[Gemini Service] Analysis complete');
      return this.parseAnalysisResponse(text, request.selectedText);
    } catch (error) {
      console.error('[Gemini Service] Error analyzing text:', error);
      return this.fallbackAnalysis(request.selectedText);
    }
  }

  /**
   * Generate mind map insights using Gemini API
   */
  async generateMindMapInsights(request: MindMapAnalysisRequest): Promise<MindMapInsights> {
    console.log('[Gemini Service] Generating mind map insights...');

    // If no API key, return mock response
    if (!this.model) {
      console.log('[Gemini Service] Using mock response (no API key)');
      return this.fallbackMindMapAnalysis(request);
    }

    try {
      const prompt = this.buildMindMapAnalysisPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('[Gemini Service] Mind map insights complete');
      return this.parseMindMapResponse(text, request);
    } catch (error) {
      console.error('[Gemini Service] Error generating mind map:', error);
      return this.fallbackMindMapAnalysis(request);
    }
  }

  /**
   * Process chat message with document context
   * NEW: For POC chat feature
   */
  async processChatWithDocument(
    userMessage: string,
    documentText: string,
    chatHistory: Array<{ content: string, sender: string }>,
    domain: string
  ): Promise<any> {
    console.log('[Gemini Service] Processing chat with document context');

    // If no API key, return mock response
    if (!this.model) {
      console.log('[Gemini Service] Using mock chat response (no API key)');
      return this.fallbackChatResponse(userMessage, documentText, domain);
    }

    try {
      const prompt = this.buildChatPrompt(userMessage, documentText, chatHistory, domain);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('[Gemini Service] Chat response received');
      console.log('[Gemini Service] Raw response text:', text);

      const parsedResponse = this.parseChatResponse(text);
      console.log('[Gemini Service] Parsed response type:', parsedResponse.responseType);
      console.log('[Gemini Service] Parsed response data:', parsedResponse);

      return parsedResponse;
    } catch (error) {
      console.error('[Gemini Service] Error in chat:', error);
      return this.fallbackChatResponse(userMessage, documentText, domain);
    }
  }

  /**
   * Build legal analysis prompt (original Bedrock prompt adapted for Gemini)
   */
  private buildLegalAnalysisPrompt(request: TextAnalysisRequest): string {
    const { selectedText, context, documentType = "legal document" } = request;

    return `You are a legal expert specializing in Malaysian law. Your task is to analyze legal text and provide concise, layman-friendly explanations for non-lawyers.

IMPORTANT INSTRUCTIONS:
- Keep explanations SHORT and SIMPLE (2-3 sentences max)
- Use plain language that anyone can understand
- HIGHLIGHT the most important parts using <strong>bold</strong> tags ONLY
- DO NOT use asterisks (*), markdown formatting, or any other special characters
- Focus on what this means for the person reading the document
- Always consider Malaysian legal context

Categories:
- clause: Contract provisions or specific legal clauses
- legal-term: Legal terminology or concepts
- obligation: Duties or requirements that must be fulfilled
- right: Legal rights or entitlements
- warning: Potentially problematic or concerning provisions
- general: General legal information

Respond in this exact JSON format:
{
  "explanation": "Short, simple explanation with <strong>key points bolded</strong> and <strong>important terms highlighted</strong>",
  "category": "category_name",
  "confidence": 85
}

IMPORTANT: Always wrap key legal terms, important concepts, and critical information in <strong></strong> tags for highlighting.

Document Type: ${documentType}
Selected Text: "${selectedText}"
${context ? `Context: "${context}"` : ""}

Analyze this text and explain what it means in simple terms, focusing on Malaysian law.`;
  }

  /**
   * Build mind map analysis prompt (original Bedrock prompt adapted for Gemini)
   */
  private buildMindMapAnalysisPrompt(request: MindMapAnalysisRequest): string {
    return `You are a legal expert analyzing a collection of legal documents and conversations for a Malaysian SME.

Collection: ${request.collectionTitle}
Domain: ${request.collectionDomain}
Summary: ${request.collectionSummary}

Documents (${request.documents.length}):
${request.documents.map(d => `- ${d.originalFilename}${d.contentSummary ? ': ' + d.contentSummary : ''}`).join('\n')}

Conversations (${request.conversations.length}):
${request.conversations.map(c => `- ${c.title}`).join('\n')}

Action Items (${request.actionItems.length}):
${request.actionItems.map(a => `- [${a.priority}] ${a.title}: ${a.description}`).join('\n')}

Analyze this collection and provide comprehensive insights in JSON format:
{
  "keyThemes": [{"id": "1", "name": "Theme Name", "description": "Detailed description", "importance": "high", "relatedItems": [{"type": "document", "id": "1", "title": "Document name"}]}],
  "urgentActions": [{"id": "1", "title": "Action title", "reasoning": "Why this is urgent", "suggestedDeadline": "2025-12-31"}],
  "riskFactors": [{"description": "Risk description", "severity": "high", "affectedItems": ["id1", "id2"]}],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "connections": []
}

Focus on:
1. Malaysian legal compliance and requirements
2. Practical advice for SMEs and individuals
3. Identifying risks and urgent matters
4. Clear, actionable recommendations

Generate comprehensive insights now.`;
  }

  /**
   * Parse Gemini response for text analysis
   */
  private parseAnalysisResponse(text: string, selectedText: string): TextAnalysisResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          explanation: parsed.explanation || `Analysis of "${selectedText}"`,
          category: this.validateCategory(parsed.category),
          confidence: Math.min(100, Math.max(0, parsed.confidence || 75)),
        };
      }

      // If no JSON, parse as plain text
      return this.fallbackAnalysis(selectedText);
    } catch (error) {
      console.error('[Gemini Service] Error parsing response:', error);
      return this.fallbackAnalysis(selectedText);
    }
  }

  /**
   * Parse Gemini response for mind map analysis
   */
  private parseMindMapResponse(text: string, request: MindMapAnalysisRequest): MindMapInsights {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          keyThemes: parsed.keyThemes || [],
          urgentActions: parsed.urgentActions || [],
          riskFactors: parsed.riskFactors || [],
          recommendations: parsed.recommendations || [],
          connections: parsed.connections || [],
        };
      }

      // If no JSON, use fallback
      return this.fallbackMindMapAnalysis(request);
    } catch (error) {
      console.error('[Gemini Service] Error parsing mind map response:', error);
      return this.fallbackMindMapAnalysis(request);
    }
  }

  /**
   * Validate category
   */
  private validateCategory(category: string): TextAnalysisResponse["category"] {
    const validCategories = ["clause", "legal-term", "obligation", "right", "warning", "general"];
    return validCategories.includes(category) ? category as TextAnalysisResponse["category"] : "general";
  }

  /**
   * Fallback analysis when Gemini is unavailable
   */
  private fallbackAnalysis(selectedText: string): TextAnalysisResponse {
    const cleanedText = selectedText.toLowerCase();

    let explanation = "";
    let category: TextAnalysisResponse["category"] = "general";

    // Provide contextual mock responses based on content
    if (cleanedText.includes("epf") || cleanedText.includes("provident fund")) {
      explanation = "<strong>EPF (Employees Provident Fund)</strong> is a <strong>mandatory retirement savings scheme</strong> in Malaysia where both employer and employee contribute a percentage of the salary.";
      category = "legal-term";
    } else if (cleanedText.includes("socso") || cleanedText.includes("social security")) {
      explanation = "<strong>SOCSO (Social Security Organisation)</strong> provides <strong>social security protection</strong> to employees through employment injury and pension schemes.";
      category = "legal-term";
    } else if (cleanedText.includes("shall") || cleanedText.includes("must") || cleanedText.includes("required")) {
      explanation = `This creates a <strong>legal obligation</strong> that must be fulfilled. Failure to comply may result in legal consequences.`;
      category = "obligation";
    } else if (cleanedText.includes("may") || cleanedText.includes("entitled") || cleanedText.includes("right")) {
      explanation = `This establishes a <strong>right or option</strong> that the party can choose to exercise.`;
      category = "right";
    } else {
      explanation = `This appears to be a <strong>legal provision</strong>. Consider consulting a legal professional for specific interpretation.`;
      category = "general";
    }

    return {
      explanation,
      category,
      confidence: 75,
    };
  }

  /**
   * Fallback mind map analysis when Gemini is unavailable
   */
  private fallbackMindMapAnalysis(request: MindMapAnalysisRequest): MindMapInsights {
    console.log('[Gemini Service] Using fallback mind map analysis');

    const keyThemes = [
      {
        id: "theme_1",
        name: "Legal Compliance",
        description: `Key legal and regulatory requirements identified in ${request.collectionDomain}`,
        importance: "high" as const,
        relatedItems: request.documents.slice(0, 2).map(doc => ({
          type: "document" as const,
          id: doc.id,
          title: doc.originalFilename,
        })),
      },
    ];

    const urgentActions = request.actionItems
      .filter(a => a.priority === "urgent" && a.status === "pending")
      .map(action => ({
        id: action.id,
        title: action.title,
        reasoning: `${action.description} - Marked as urgent`,
        suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));

    const riskFactors = [
      {
        description: "Pending action items require attention",
        severity: "medium" as const,
        affectedItems: request.actionItems.filter(a => a.status === "pending").map(a => a.id),
      },
    ];

    const recommendations = [
      `Complete all pending action items for ${request.collectionTitle}`,
      "Review documents with legal counsel",
      "Maintain compliance documentation",
    ];

    return {
      keyThemes,
      urgentActions,
      riskFactors,
      recommendations,
      connections: [],
    };
  }

  /**
   * Build chat prompt with document context
   */
  private buildChatPrompt(
    userMessage: string,
    documentText: string,
    chatHistory: Array<{ content: string, sender: string }>,
    domain: string
  ): string {
    const historyText = chatHistory
      .slice(-2) // Last 5 messages for context (history)
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const documentContext = documentText ? `
The user has uploaded a document. Here's the content:

--- DOCUMENT START ---
${documentText.substring(0, 50000)}
--- DOCUMENT END ---
` : '';

    return `You are LegalKaki, an expert legal AI assistant specializing in Malaysian law. You help everyday people understand their legal situations and take appropriate action.

## CRITICAL: ALWAYS RETURN JSON

You MUST respond with ONLY valid JSON. No markdown code blocks, no extra text, just raw JSON.

START YOUR RESPONSE WITH: {
END YOUR RESPONSE WITH: }

here are the document chunks: 
${documentContext}

${historyText ? `Chat History:\n${historyText}\n` : ''}

User asks: ${userMessage}

## RESPONSE FORMAT

Decide if this needs a simple reply or full 3-tab analysis:

### FOR SIMPLE FOLLOW-UP (greetings, thanks, clarifications):

{
  "response_type": "simple",
  "message": "Your friendly conversational response"
}

### FOR 3-TAB LEGAL ANALYSIS (default for legal questions):

{
  "response_type": "final",
  "system_message": "Here's my detailed analysis:",
  "explanation": {
    "text": "Your clear explanation in plain language. Focus on what the user needs to know about their legal situation."
  },
  "analysis": {
    "risks": [
      {
        "severity": "HIGH|MEDIUM|LOW",
        "title": "Risk title",
        "description": "What the risk is"
      }
    ],
    "key_points": [
      "First important point",
      "Second important point",
      "Third important point"
    ]
  },
  "actions": [
    {
      "id": "action_[timestamp]_[random]",
      "title": "Action item title",
      "description": "What needs to be done",
      "priority": "urgent|important|normal",
      "status": "pending",
      "dueDate": "2025-12-31",
      "externalLinks": [
        {
          "text": "Button text",
          "url": "https://example.com"
        }
      ]
    }
  ]
}

## GUIDELINES

**Explanation Tab:**
- 2-3 paragraphs max
- Plain language, no legal jargon
- Focus on the legal concepts of user's question, NOT document chunks
- Focus on what the user needs to understand
- focuses on explaining concepts and not providing legal advice. eg: if the user ask about partnering with a company, the explanation should be about the concept of partnering and not providing legal advice.

**Analysis Tab:**
- List 2-4 risks with severity levels (HIGH/MEDIUM/LOW)
- now focus on document chunks and the user's question.
- Keep risk descriptions concise
- List 3-5 key points as bullet points

**Actions Tab:**
- List 2-4 actionable steps with unique IDs (format: "action_[timestamp]_[random]")
- Assign priority: "urgent", "important", or "normal" (LOWERCASE ONLY)
- Always set status: "pending" for new actions
- Include dueDate as ISO date string (YYYY-MM-DD) if action is time-sensitive (optional)
- Format links as externalLinks array: [{"text": "Link text", "url": "https://..."}]
- If no links, use empty array: "externalLinks": []
- always be cautious with actions steps because it may not have actions for the user to take.

**Malaysian Law Context:**
- Reference specific Malaysian laws (Employment Act 1955, Contracts Act 1950, etc.)
- Mention relevant agencies (SSM, JTK, LHDN, Malaysian Bar)
- Always include: "This is not legal advice. Consult a licensed lawyer."

Remember: Return ONLY JSON. No markdown blocks. Choose "simple" for casual messages, "final" for legal questions.`;
  }

  /**
   * Parse Gemini chat response - SIMPLIFIED
   * Handles "simple" and "final" (3-tab) response types
   */
  private parseChatResponse(text: string): any {
    try {
      // Remove markdown code blocks if present (```json ... ```)
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to extract JSON from response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // No JSON found, treat as simple text
        return {
          responseType: 'simple',
          message: text,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Simple conversational response
      if (parsed.response_type === 'simple') {
        return {
          responseType: 'simple',
          message: parsed.message || text,
        };
      }

      // 3-tab legal analysis (simplified structure)
      if (parsed.response_type === 'final') {
        return {
          responseType: 'final',
          systemMessage: parsed.system_message || "Here's my analysis:",
          explanation: parsed.explanation,
          analysis: parsed.analysis,
          actions: parsed.actions,
        };
      }

      // Fallback: treat as simple message
      return {
        responseType: 'simple',
        message: text,
      };
    } catch (error) {
      console.error('[Gemini Service] Error parsing chat response:', error);
      return {
        responseType: 'simple',
        message: text || 'I encountered an error processing the response. Please try again.',
      };
    }
  }

  /**
   * Fallback chat response when Gemini is unavailable - SIMPLIFIED
   */
  private fallbackChatResponse(
    userMessage: string,
    documentText: string,
    domain: string
  ): any {
    console.log('[Gemini Service] Using fallback chat response');

    return {
      responseType: 'final',
      systemMessage: 'This is a mock response. Add your Gemini API key for real AI analysis.',
      explanation: {
        text: `Based on your question about ${domain}, this appears to be a legal matter that requires careful consideration. In Malaysia, legal documents and agreements are governed by various laws including the Contracts Act 1950 and domain-specific legislation. It's important to understand your rights and obligations before proceeding. This is not legal advice - please consult a licensed lawyer for your specific situation.`,
      },
      analysis: {
        risks: [
          {
            severity: 'MEDIUM',
            title: 'Document requires professional review',
            description: 'Legal documents should be reviewed by qualified counsel to understand all implications',
          },
        ],
        key_points: [
          'Legal documents require careful review',
          'Professional legal advice is recommended',
          'Malaysian law governs the interpretation',
          'Timeframes and deadlines may be critical',
        ],
      },
      actions: [
        {
          title: 'Consult with a Legal Professional',
          description: 'Schedule a consultation with a lawyer who specializes in this area',
          priority: 'IMPORTANT',
          link_text: 'Find a Lawyer',
          link_url: 'https://www.malaysianbar.org.my',
        },
      ],
    };
  }

  /**
   * Generate draft legal document
   * POC: Uses Gemini Flash to generate document content
   */
  async generateDraftDocument(
    prompt: string,
    title: string,
    domain: string,
    context?: string
  ): Promise<string> {
    try {
      console.log('[Gemini Service] Generating draft document:', title);

      const draftPrompt = `You are an expert legal document drafting assistant specializing in Malaysian law (e.g., Contracts Act 1950, Employment Act 1955, Companies Act 2016) for the ${domain} domain.

User Request: ${prompt}

Document Title: ${title}

${context ? `Additional Context:\n${context}\n` : ''}

INSTRUCTIONS:
1. Generate a comprehensive, legally sound document based on the user's request.
2. Ensure strict adherence to Malaysian legal standards and terminology.
3. Use professional, formal legal language.
4. Include all standard clauses (e.g., Governing Law, Dispute Resolution, Severability) appropriate for this type of document.
5. Format the document clearly with section headings (e.g., "1. DEFINITIONS", "2. OBLIGATIONS").
6. Use placeholders like [PARTY NAME], [DATE], [AMOUNT] for variable details.
7. If the user request implies editing an existing text provided in the prompt, output the *full* revised document, incorporating the changes seamlessly.

OUTPUT FORMAT:
- Plain text with clear spacing between sections.
- Do not use markdown code blocks (like \`\`\`).
- Do not include conversational filler (e.g., "Here is your draft"). Just the document content.`;

      const result = await this.model.generateContent(draftPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('[Gemini Service] Draft generated, length:', text.length);
      return text;
    } catch (error) {
      console.error('[Gemini Service] Error generating draft:', error);

      // Return fallback draft
      return this.fallbackDraft(title, prompt);
    }
  }

  /**
   * Detect user intent (Draft vs Question)
   */
  async detectIntent(prompt: string): Promise<'DRAFT' | 'QUESTION'> {
    try {
      if (!this.model) return 'QUESTION'; // Fallback

      const intentPrompt = `Classify the following user input into one of two categories:
      1. DRAFT: The user wants to create a document, edit a document, add a clause, change wording, or refine the text. (e.g., "make it formal", "add a termination clause", "draft a contract", "change section 3")
      2. QUESTION: The user is asking a question about the document, asking for an explanation, or general legal advice, WITHOUT asking to change the document text itself. (e.g., "what does this clause mean?", "is this legal?", "explain section 5")

      User Input: "${prompt}"

      Respond with ONLY the category name: DRAFT or QUESTION.`;

      const result = await this.model.generateContent(intentPrompt);
      const response = await result.response;
      const text = response.text().trim().toUpperCase();

      if (text.includes('DRAFT')) return 'DRAFT';
      return 'QUESTION';
    } catch (error) {
      console.error('[Gemini Service] Error detecting intent:', error);
      return 'QUESTION'; // Default to question on error to be safe
    }
  }

  /**
   * Summarize chat history into a title and short description
   */
  async generateChatSummary(
    chatHistory: Array<{ content: string, sender: string }>,
    draftContent?: string
  ): Promise<{ title: string; description: string }> {
    try {
      console.log('[Gemini Service] Generating chat summary...');

      if (!this.model) {
        return {
          title: "Legal Document Draft",
          description: "Draft generated based on user request."
        };
      }

      const historyText = chatHistory
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');

      const prompt = `Analyze the following chat history and draft document context.
Summarize the user's intent into a concise Title (max 50 chars) and a Short Description (max 300 chars).
Focus on what the user is trying to achieve (e.g., 'Drafting an Employment Contract', 'Reviewing a NDA').

Chat History:
${historyText}

${draftContent ? `Draft Content Preview:\n${draftContent.substring(0, 1000)}...` : ''}

Respond with ONLY valid JSON:
{
  "title": "Concise Title",
  "description": "Short description of the user's intent and the document's purpose."
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedText);
      return {
        title: parsed.title || "Legal Document Draft",
        description: parsed.description || "Draft generated based on user request."
      };

    } catch (error) {
      console.error('[Gemini Service] Error generating summary:', error);
      return {
        title: "Legal Document Draft",
        description: "Draft generated based on user request."
      };
    }
  }

  /**
   * Fallback draft when Gemini is unavailable
   */
  private fallbackDraft(title: string, prompt: string): string {
    return `${title.toUpperCase()}

[Generated Document - POC Mode]

This document was generated based on your request: "${prompt}"

--- DOCUMENT CONTENT ---

1. INTRODUCTION
   This document serves as a template for ${title.toLowerCase()}.

2. PARTIES
   This agreement is made between:
   - Party A: [NAME AND DETAILS]
   - Party B: [NAME AND DETAILS]

3. TERMS AND CONDITIONS
   3.1 The parties agree to [SPECIFIC TERMS]
   3.2 The effective date shall be [DATE]
   3.3 The parties shall comply with all applicable Malaysian laws

4. OBLIGATIONS
   4.1 Party A shall: [SPECIFIC OBLIGATIONS]
   4.2 Party B shall: [SPECIFIC OBLIGATIONS]

5. SIGNATURES
   Signed on this day of [DATE]

   ________________________
   Party A Signature

   ________________________
   Party B Signature

--- END OF DOCUMENT ---

Note: This is a template document. Please customize with specific details and have it reviewed by a qualified legal professional before use.`;
  }

  /**
   * Generate embedding for a text using Gemini
   * Used for RAG (Retrieval-Augmented Generation)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    console.log('[Gemini Service] Generating embedding...');

    // If no API key, return mock embedding
    if (!this.embeddingModel) {
      console.log('[Gemini Service] Using mock embedding (no API key)');
      return this.generateMockEmbedding(text);
    }

    try {
      const result = await this.embeddingModel.embedContent(text);
      const embedding = result.embedding;

      if (!embedding || !embedding.values) {
        throw new Error('Invalid embedding response');
      }

      console.log('[Gemini Service] Embedding generated, dimensions:', embedding.values.length);
      return embedding.values;
    } catch (error) {
      console.error('[Gemini Service] Error generating embedding:', error);
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than calling generateEmbedding multiple times
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    console.log(`[Gemini Service] Generating ${texts.length} embeddings in batch...`);

    // If no API key, return mock embeddings
    if (!this.embeddingModel) {
      console.log('[Gemini Service] Using mock embeddings (no API key)');
      return texts.map(text => this.generateMockEmbedding(text));
    }

    try {
      // Generate embeddings one by one (Gemini API may not support batch)
      // In production, you might want to implement proper batching
      const embeddings: number[][] = [];

      for (const text of texts) {
        const result = await this.embeddingModel.embedContent(text);
        const embedding = result.embedding;

        if (!embedding || !embedding.values) {
          throw new Error('Invalid embedding response');
        }

        embeddings.push(embedding.values);
      }

      console.log(`[Gemini Service] Generated ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error) {
      console.error('[Gemini Service] Error generating batch embeddings:', error);
      return texts.map(text => this.generateMockEmbedding(text));
    }
  }

  /**
   * Generate a mock embedding based on text hash
   * Used as fallback when Gemini is unavailable
   */
  private generateMockEmbedding(text: string): number[] {
    // Generate a deterministic 768-dimensional vector based on text
    const dimensions = 768;
    const embedding: number[] = [];

    // Use text hash as seed
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }

    // Generate pseudo-random values
    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i;
      const x = Math.sin(seed) * 10000;
      embedding.push(x - Math.floor(x));
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;

// Export as bedrockService for backward compatibility
export const bedrockService = geminiService;
