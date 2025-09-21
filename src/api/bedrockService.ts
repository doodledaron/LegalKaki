import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

// Types for Bedrock service
export interface TextAnalysisRequest {
  selectedText: string
  context?: string
  documentType?: string
  pageNumber?: number
}

export interface TextAnalysisResponse {
  explanation: string
  category: 'clause' | 'legal-term' | 'obligation' | 'right' | 'warning' | 'general'
  confidence: number
}

export interface MindMapAnalysisRequest {
  collectionTitle: string
  collectionDomain: string
  collectionSummary: string
  conversations: Array<{
    id: string
    title: string
    domain: string
    messages: unknown[]
  }>
  documents: Array<{
    id: string
    originalFilename: string
    contentSummary?: string
  }>
  actionItems: Array<{
    id: string
    title: string
    description: string
    priority: 'urgent' | 'important' | 'normal'
    status: 'pending' | 'in_progress' | 'completed'
  }>
}

export interface MindMapInsights {
  keyThemes: Array<{
    id: string
    name: string
    description: string
    importance: 'high' | 'medium' | 'low'
    relatedItems: Array<{
      type: 'document' | 'conversation' | 'action'
      id: string
      title: string
    }>
  }>
  urgentActions: Array<{
    id: string
    title: string
    reasoning: string
    suggestedDeadline: string
  }>
  riskFactors: Array<{
    description: string
    severity: 'high' | 'medium' | 'low'
    affectedItems: string[]
  }>
  recommendations: string[]
  connections: Array<{
    fromId: string
    toId: string
    relationship: string
    strength: number
  }>
}

// Bedrock configuration
const BEDROCK_CONFIG = {
  region: 'us-east-1',
  modelId: 'us.meta.llama3-3-70b-instruct-v1:0'
}

class BedrockService {
  private client: BedrockRuntimeClient

  constructor() {
    // Initialize Bedrock client with environment variables
    this.client = new BedrockRuntimeClient({
      region: BEDROCK_CONFIG.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        // No session token needed for permanent credentials
      }
    })
  }

  async analyzeText(request: TextAnalysisRequest): Promise<TextAnalysisResponse> {
    try {
      // Construct the prompt for legal text analysis
      const prompt = this.buildLegalAnalysisPrompt(request)
      
      // Prepare the request for Llama 3.3 70B
      const input = {
        modelId: BEDROCK_CONFIG.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: prompt,
          max_gen_len: 500,
          temperature: 0.3,
          top_p: 0.9
        })
      }

      // Call Bedrock
      const command = new InvokeModelCommand(input)
      const response = await this.client.send(command)
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      const generatedText = responseBody.generation

      // Parse the structured response
      return this.parseAnalysisResponse(generatedText, request.selectedText)
      
    } catch (error) {
      console.error('Bedrock analysis error:', error)
      
      // Fallback to local analysis if Bedrock fails
      return this.fallbackAnalysis(request.selectedText)
    }
  }

  async generateMindMapInsights(request: MindMapAnalysisRequest): Promise<MindMapInsights> {
    try {
      console.log('🧠 Generating AI mind map insights for:', request.collectionTitle)
      
      // Construct the prompt for mind map analysis
      const prompt = this.buildMindMapAnalysisPrompt(request)
      
      // Prepare the request for Llama 3.3 70B
      const input = {
        modelId: BEDROCK_CONFIG.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: prompt,
          max_gen_len: 1500, // Longer response for mind map analysis
          temperature: 0.4,  // Slightly higher for creativity
          top_p: 0.9
        })
      }

      // Call Bedrock
      const command = new InvokeModelCommand(input)
      const response = await this.client.send(command)
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))
      const generatedText = responseBody.generation

      // Parse the structured response
      return this.parseMindMapResponse(generatedText, request)
      
    } catch (error) {
      console.error('Bedrock mind map analysis error:', error)
      
      // Fallback to basic analysis if Bedrock fails
      return this.fallbackMindMapAnalysis(request)
    }
  }

  private buildLegalAnalysisPrompt(request: TextAnalysisRequest): string {
    const { selectedText, context, documentType = 'legal document' } = request
    
    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a legal expert specializing in Malaysian law. Your task is to analyze legal text and provide concise, layman-friendly explanations for non-lawyers.

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

<|eot_id|><|start_header_id|>user<|end_header_id|>

Document Type: ${documentType}
Selected Text: "${selectedText}"
${context ? `Context: "${context}"` : ''}

Analyze this text and explain what it means in simple terms, focusing on Malaysian law.<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`
  }

  private parseAnalysisResponse(generatedText: string, selectedText: string): TextAnalysisResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        let explanation = parsed.explanation || `Analysis of "${selectedText}"`
        
        // Clean up unwanted characters and formatting
        explanation = this.cleanupResponse(explanation)
        
        // Ensure we have some bold formatting
        if (!explanation.includes('<strong>') && !explanation.includes('<b>')) {
          explanation = this.addBasicBoldFormatting(explanation)
        }
        
        return {
          explanation,
          category: this.validateCategory(parsed.category),
          confidence: Math.min(100, Math.max(0, parsed.confidence || 75))
        }
      }
      
      // If no JSON found, parse from text
      return this.parseTextResponse(generatedText, selectedText)
      
    } catch (error) {
      console.error('Error parsing Bedrock response:', error)
      return this.fallbackAnalysis(selectedText)
    }
  }

  private parseTextResponse(text: string, selectedText: string): TextAnalysisResponse {
    // Extract explanation from text response and add basic formatting
    let explanation = text.trim() || `This legal text: "${selectedText}" requires professional interpretation for your specific situation.`
    
    // Clean up unwanted characters and formatting
    explanation = this.cleanupResponse(explanation)
    
    // Add some basic bold formatting for key terms if not already present
    if (!explanation.includes('<strong>') && !explanation.includes('<b>')) {
      explanation = this.addBasicBoldFormatting(explanation)
    }
    
    // Determine category based on content
    const category = this.categorizeFromText(selectedText, text)
    
    return {
      explanation,
      category,
      confidence: 70
    }
  }

  private cleanupResponse(text: string): string {
    // Remove asterisks and other unwanted markdown-style formatting
    const cleaned = text
      .replace(/\*\*/g, '') // Remove ** bold markers
      .replace(/\*/g, '')   // Remove * italic markers
      .replace(/##/g, '')   // Remove ## headers
      .replace(/#/g, '')    // Remove # headers
      .replace(/`/g, '')    // Remove backticks
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
    
    return cleaned
  }

  private categorizeFromText(selectedText: string, analysis: string): TextAnalysisResponse['category'] {
    const text = (selectedText + ' ' + analysis).toLowerCase()
    
    if (text.includes('shall') || text.includes('must') || text.includes('required') || text.includes('obligation')) {
      return 'obligation'
    }
    
    if (text.includes('entitled') || text.includes('right') || text.includes('may') || text.includes('allowed')) {
      return 'right'
    }
    
    if (text.includes('warning') || text.includes('risk') || text.includes('concern') || text.includes('problematic')) {
      return 'warning'
    }
    
    if (text.includes('clause') || text.includes('provision') || text.includes('section')) {
      return 'clause'
    }
    
    if (text.includes('epf') || text.includes('socso') || text.includes('legal term') || text.includes('legal concept')) {
      return 'legal-term'
    }
    
    return 'general'
  }

  private addBasicBoldFormatting(text: string): string {
    // Add bold formatting to key legal terms and important concepts
    const patterns = [
      { regex: /\b(EPF|SOCSO|SSM|Companies Commission)\b/gi, replacement: '<strong>$1</strong>' },
      { regex: /\b(Employment Act|Partnership Act|Contracts Act|Uniform Partnership Act)\b/gi, replacement: '<strong>$1</strong>' },
      { regex: /\b(shall|must|required|obligation|mandatory)\b/gi, replacement: '<strong>$1</strong>' },
      { regex: /\b(rights?|entitled|may|can)\b/gi, replacement: '<strong>$1</strong>' },
      { regex: /\b(confidential|non-compete|termination|partnership)\b/gi, replacement: '<strong>$1</strong>' },
      { regex: /\b(Malaysia|Malaysian|business purpose|capital contributions)\b/gi, replacement: '<strong>$1</strong>' },
      { regex: /\b(terms and conditions|principal place of business)\b/gi, replacement: '<strong>$1</strong>' },
      { regex: /\b(legal obligation|business partnership|social security|retirement savings)\b/gi, replacement: '<strong>$1</strong>' }
    ]
    
    let formatted = text
    patterns.forEach(({ regex, replacement }) => {
      formatted = formatted.replace(regex, replacement)
    })
    
    return formatted
  }

  private validateCategory(category: string): TextAnalysisResponse['category'] {
    const validCategories: TextAnalysisResponse['category'][] = [
      'clause', 'legal-term', 'obligation', 'right', 'warning', 'general'
    ]
    
    return validCategories.includes(category as TextAnalysisResponse['category']) ? category as TextAnalysisResponse['category'] : 'general'
  }

  private buildMindMapAnalysisPrompt(request: MindMapAnalysisRequest): string {
    const { collectionTitle, collectionDomain, collectionSummary, conversations, documents, actionItems } = request
    
    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a legal expert specializing in Malaysian law. Your task is to analyze a legal collection and generate insights for an interactive mind map.

INSTRUCTIONS:
- Analyze the collection data and identify key themes, relationships, and insights
- Focus on Malaysian legal context and practical implications
- Identify urgent actions and risk factors
- Provide clear recommendations
- Generate meaningful connections between items

Respond in this exact JSON format:
{
  "keyThemes": [
    {
      "id": "theme_1",
      "name": "Theme Name",
      "description": "Brief description of the theme",
      "importance": "high|medium|low",
      "relatedItems": [
        {"type": "document|conversation|action", "id": "item_id", "title": "Item Title"}
      ]
    }
  ],
  "urgentActions": [
    {
      "id": "action_id",
      "title": "Action Title",
      "reasoning": "Why this is urgent",
      "suggestedDeadline": "Timeline suggestion"
    }
  ],
  "riskFactors": [
    {
      "description": "Risk description",
      "severity": "high|medium|low",
      "affectedItems": ["item_id1", "item_id2"]
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "connections": [
    {
      "fromId": "item_id_1",
      "toId": "item_id_2",
      "relationship": "relationship description",
      "strength": 0.8
    }
  ]
}

<|eot_id|><|start_header_id|>user<|end_header_id|>

COLLECTION ANALYSIS REQUEST:

Title: ${collectionTitle}
Domain: ${collectionDomain}
Summary: ${collectionSummary}

CONVERSATIONS (${conversations.length} total):
${conversations.map(conv => `- ID: ${conv.id}, Title: "${conv.title}", Messages: ${conv.messages.length}`).join('\n')}

DOCUMENTS (${documents.length} total):
${documents.map(doc => `- ID: ${doc.id}, Filename: "${doc.originalFilename}"${doc.contentSummary ? `, Summary: "${doc.contentSummary}"` : ''}`).join('\n')}

ACTION ITEMS (${actionItems.length} total):
${actionItems.map(action => `- ID: ${action.id}, Title: "${action.title}", Priority: ${action.priority}, Status: ${action.status}, Description: "${action.description}"`).join('\n')}

Analyze this legal collection and provide insights for a mind map, focusing on Malaysian law context.<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`
  }

  private parseMindMapResponse(generatedText: string, request: MindMapAnalysisRequest): MindMapInsights {
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        return {
          keyThemes: this.validateThemes(parsed.keyThemes || []),
          urgentActions: this.validateUrgentActions(parsed.urgentActions || []),
          riskFactors: this.validateRiskFactors(parsed.riskFactors || []),
          recommendations: parsed.recommendations || [],
          connections: this.validateConnections(parsed.connections || [])
        }
      }
      
      // If no JSON found, return fallback
      return this.fallbackMindMapAnalysis(request)
      
    } catch (error) {
      console.error('Error parsing mind map response:', error)
      return this.fallbackMindMapAnalysis(request)
    }
  }

  private validateThemes(themes: any[]): MindMapInsights['keyThemes'] {
    return themes.filter(theme => theme.id && theme.name).map(theme => ({
      id: theme.id,
      name: theme.name,
      description: theme.description || '',
      importance: ['high', 'medium', 'low'].includes(theme.importance) ? theme.importance : 'medium',
      relatedItems: (theme.relatedItems || []).filter((item: any) => item.type && item.id && item.title)
    }))
  }

  private validateUrgentActions(actions: any[]): MindMapInsights['urgentActions'] {
    return actions.filter(action => action.id && action.title).map(action => ({
      id: action.id,
      title: action.title,
      reasoning: action.reasoning || 'Requires immediate attention',
      suggestedDeadline: action.suggestedDeadline || 'Within 7 days'
    }))
  }

  private validateRiskFactors(risks: any[]): MindMapInsights['riskFactors'] {
    return risks.filter(risk => risk.description).map(risk => ({
      description: risk.description,
      severity: ['high', 'medium', 'low'].includes(risk.severity) ? risk.severity : 'medium',
      affectedItems: Array.isArray(risk.affectedItems) ? risk.affectedItems : []
    }))
  }

  private validateConnections(connections: any[]): MindMapInsights['connections'] {
    return connections.filter(conn => conn.fromId && conn.toId && conn.relationship).map(conn => ({
      fromId: conn.fromId,
      toId: conn.toId,
      relationship: conn.relationship,
      strength: typeof conn.strength === 'number' ? Math.max(0, Math.min(1, conn.strength)) : 0.5
    }))
  }

  private fallbackMindMapAnalysis(request: MindMapAnalysisRequest): MindMapInsights {
    // Basic fallback analysis when AI is unavailable
    const urgentActions = request.actionItems.filter(action => action.priority === 'urgent')
    const pendingActions = request.actionItems.filter(action => action.status === 'pending')
    
    const keyThemes: MindMapInsights['keyThemes'] = []
    
    // Create themes based on content
    if (request.documents.length > 0) {
      keyThemes.push({
        id: 'documents_theme',
        name: 'Document Analysis',
        description: `${request.documents.length} documents requiring review`,
        importance: 'high',
        relatedItems: request.documents.map(doc => ({
          type: 'document',
          id: doc.id,
          title: doc.originalFilename
        }))
      })
    }
    
    if (request.conversations.length > 0) {
      keyThemes.push({
        id: 'conversations_theme',
        name: 'Legal Discussions',
        description: `${request.conversations.length} active conversations`,
        importance: 'medium',
        relatedItems: request.conversations.map(conv => ({
          type: 'conversation',
          id: conv.id,
          title: conv.title
        }))
      })
    }
    
    if (urgentActions.length > 0) {
      keyThemes.push({
        id: 'urgent_theme',
        name: 'Urgent Matters',
        description: `${urgentActions.length} urgent actions requiring immediate attention`,
        importance: 'high',
        relatedItems: urgentActions.map(action => ({
          type: 'action',
          id: action.id,
          title: action.title
        }))
      })
    }
    
    return {
      keyThemes,
      urgentActions: urgentActions.map(action => ({
        id: action.id,
        title: action.title,
        reasoning: 'Marked as urgent priority',
        suggestedDeadline: 'Within 48 hours'
      })),
      riskFactors: urgentActions.length > 0 ? [{
        description: 'Multiple urgent actions may indicate time-sensitive legal matters',
        severity: 'medium' as const,
        affectedItems: urgentActions.map(a => a.id)
      }] : [],
      recommendations: [
        'Review all urgent action items immediately',
        'Consider scheduling a legal consultation',
        'Ensure all documents are properly analyzed'
      ],
      connections: []
    }
  }

  private fallbackAnalysis(selectedText: string): TextAnalysisResponse {
    // Fallback analysis when Bedrock is unavailable
    const cleanedText = this.cleanupResponse(selectedText)
    const lowerText = cleanedText.toLowerCase()
    
    let explanation = ''
    let category: TextAnalysisResponse['category'] = 'general'
    
    if (lowerText.includes('epf')) {
      explanation = '<strong>EPF</strong> is a <strong>mandatory retirement savings scheme</strong> in Malaysia where both employer and employee contribute.'
      category = 'legal-term'
    } else if (lowerText.includes('socso')) {
      explanation = '<strong>SOCSO</strong> provides <strong>social security protection</strong> to employees through employment injury and pension schemes.'
      category = 'legal-term'
    } else if (lowerText.includes('shall') || lowerText.includes('must')) {
      explanation = `This creates a <strong>legal obligation</strong> that must be fulfilled.`
      category = 'obligation'
    } else if (lowerText.includes('may') || lowerText.includes('entitled')) {
      explanation = `This establishes a <strong>right or option</strong> that the party can choose to use.`
      category = 'right'
    } else if (lowerText.includes('confidential') || lowerText.includes('non-compete')) {
      explanation = `This establishes <strong>confidentiality restrictions</strong> on what you can share or do.`
      category = 'obligation'
    } else if (lowerText.includes('partnership') || lowerText.includes('partner')) {
      explanation = `This relates to a <strong>business partnership</strong> where profits and losses are shared.`
      category = 'clause'
    } else {
      explanation = `This appears to be a <strong>legal provision</strong>. Consider consulting a legal professional for specific interpretation.`
      category = 'general'
    }
    
    return {
      explanation,
      category,
      confidence: 60
    }
  }
}

// Export singleton instance
export const bedrockService = new BedrockService()
export default bedrockService
