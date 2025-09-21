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
    let cleaned = text
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
    
    return validCategories.includes(category as any) ? category as TextAnalysisResponse['category'] : 'general'
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
