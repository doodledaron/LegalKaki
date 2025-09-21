import { mockClient } from './mockClient'
import { bedrockService, TextAnalysisRequest, MindMapAnalysisRequest } from './bedrockService'
import { realApiClient } from './realApi'
import { 
  mockUser, 
  mockDomains, 
  mockCollections, 
  mockActionItems, 
  mockDocuments,
  mockChatSessions,
  mockUserStats,
  mockActivityItems,
  mockAnalysisResult,
  mockDraftResult,
  mockAiResponses
} from './mockData'
import {
  ApiResponse,
  ApiError,
  User,
  SignInRequest,
  SignInResponse,
  DomainInfo,
  Collection,
  CreateCollectionRequest,
  ChatSessionResponse,
  CreateChatSessionRequest,
  SendMessageRequest,
  SendMessageResponse,
  AnalysisResult,
  DraftResult,
  UploadDocumentRequest,
  UploadDocumentResponse,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  UserStats,
  ActivityItem,
  SearchRequest,
  SearchResponse,
  GenerateReportRequest,
  GenerateReportResponse
} from './types'
import { LegalDomain, Message, Document, ActionItem } from '@/types'

// Authentication Endpoints
export const authApi = {
  async signIn(request: SignInRequest): Promise<ApiResponse<SignInResponse> | ApiError> {
    return mockClient.request(async () => {
      // Simulate authentication logic
      if (request.email === 'demo@legalkaki.app' && request.password === 'demo123') {
        return {
          user: mockUser,
          token: `mock_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      } else {
        throw new Error('Invalid credentials')
      }
    }, 'medium', {
      successMessage: 'Successfully signed in'
    })
  },

  async signOut(): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      // Clear any stored tokens or session data
      return { success: true }
    }, 'fast', {
      successMessage: 'Successfully signed out'
    })
  },

  async refreshToken(token: string): Promise<ApiResponse<{ token: string; expiresAt: Date }> | ApiError> {
    return mockClient.request(async () => {
      return {
        token: `refreshed_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }, 'fast')
  }
}

// User Endpoints
export const userApi = {
  async getProfile(): Promise<ApiResponse<User> | ApiError> {
    return mockClient.request(async () => {
      return mockUser
    }, 'fast')
  },

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User> | ApiError> {
    return mockClient.request(async () => {
      const updatedUser = { ...mockUser, ...updates }
      return updatedUser
    }, 'medium', {
      successMessage: 'Profile updated successfully'
    })
  },

  async getStats(): Promise<ApiResponse<UserStats> | ApiError> {
    return mockClient.request(async () => {
      return mockUserStats
    }, 'fast')
  },

  async getActivity(limit: number = 10): Promise<ApiResponse<ActivityItem[]> | ApiError> {
    return mockClient.request(async () => {
      return mockActivityItems.slice(0, limit)
    }, 'fast')
  }
}

// Legal Domains Endpoints
export const domainsApi = {
  async getDomains(): Promise<ApiResponse<Record<LegalDomain, DomainInfo>> | ApiError> {
    return mockClient.request(async () => {
      return mockDomains
    }, 'fast')
  },

  async getDomain(domainId: LegalDomain): Promise<ApiResponse<DomainInfo> | ApiError> {
    return mockClient.request(async () => {
      const domain = mockDomains[domainId]
      if (!domain) {
        throw new Error('Domain not found')
      }
      return domain
    }, 'fast')
  }
}

// Chat Endpoints
export const chatApi = {
  async createSession(request: CreateChatSessionRequest): Promise<ApiResponse<ChatSessionResponse> | ApiError> {
    return mockClient.request(async () => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      
      const initialMessage: Message = {
        id: '1',
        content: `Hi! I'm your legal assistant for ${mockDomains[request.domain]?.title || 'General'} matters. How can I help you today?`,
        sender: 'assistant',
        timestamp: now,
        domain: request.domain,
        type: 'text'
      }

      const messages = [initialMessage]
      
      if (request.initialMessage) {
        const userMessage: Message = {
          id: '2',
          content: request.initialMessage,
          sender: 'user',
          timestamp: new Date(now.getTime() + 1000),
          domain: request.domain
        }
        messages.push(userMessage)
      }

      return {
        id: sessionId,
        domain: request.domain,
        title: `${mockDomains[request.domain]?.title} Consultation`,
        messages,
        createdAt: now,
        updatedAt: now,
        status: 'active' as const
      }
    }, 'medium', {
      successMessage: 'Chat session created'
    })
  },

  async getSession(sessionId: string): Promise<ApiResponse<ChatSessionResponse> | ApiError> {
    return mockClient.request(async () => {
      // For demo purposes, return a mock session
      const session = mockChatSessions.find(s => s.id === sessionId)
      if (!session) {
        throw new Error('Session not found')
      }
      return session
    }, 'fast')
  },

  async sendMessage(
    sessionId: string, 
    request: SendMessageRequest,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<ApiResponse<SendMessageResponse> | ApiError> {
    try {
      // Use real API for streaming chat
      let streamingContent = ''
      
      const realResponse = await realApiClient.sendMessage(
        request.content,
        request.messageType || 'text',
        (content) => {
          streamingContent = content
          if (onProgress) {
            const progress = Math.min(95, content.length / 10) // Rough progress estimate
            onProgress('Receiving response...', progress)
          }
        }
      )
      
      if (onProgress) {
        onProgress('Processing complete', 100)
      }
      
      return {
        success: true,
        data: realResponse,
        timestamp: new Date().toISOString(),
        message: 'Message sent successfully'
      }
    } catch (error) {
      console.error('Real API chat failed, falling back to mock:', error)
      
      // Fallback to mock implementation
      return mockClient.request(async () => {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date()

        // Create user message
        const userMessage: Message = {
          id: messageId,
          content: request.content,
          sender: 'user',
          timestamp: now,
          attachments: request.attachments?.map(id => ({
            id,
            filename: 'attached_file.pdf',
            fileType: 'application/pdf',
            fileSize: 245760,
            url: '#'
          }))
        }

        let aiResponse: Message | undefined
        let analysisResult: AnalysisResult | undefined
        let draftResult: DraftResult | undefined

        // Simulate AI processing
        if (onProgress) {
          onProgress('Processing your message...', 25)
          await new Promise(resolve => setTimeout(resolve, 500))
          onProgress('Analyzing content...', 50)
          await new Promise(resolve => setTimeout(resolve, 500))
          onProgress('Generating response...', 75)
          await new Promise(resolve => setTimeout(resolve, 500))
          onProgress('Finalizing...', 100)
        }

        // Generate AI response based on message type
        if (request.messageType === 'analysis_request') {
          analysisResult = {
            ...mockAnalysisResult,
            id: `analysis_${Date.now()}`
          }
          
          aiResponse = {
            id: `msg_${Date.now() + 1}`,
            content: "Here's my detailed analysis:",
            sender: 'assistant',
            timestamp: new Date(now.getTime() + 2000),
            type: 'analysis'
          }
        } else if (request.messageType === 'draft_request') {
          draftResult = {
            ...mockDraftResult,
            id: `draft_${Date.now()}`
          }
          
          aiResponse = {
            id: `msg_${Date.now() + 1}`,
            content: "Here's your document draft:",
            sender: 'assistant',
            timestamp: new Date(now.getTime() + 2000),
            type: 'draft'
          }
        } else {
          // Regular text response
          aiResponse = {
            id: `msg_${Date.now() + 1}`,
            content: `I understand you're asking about "${request.content}". Let me help you with that.`,
            sender: 'assistant',
            timestamp: new Date(now.getTime() + 1500),
            type: 'text'
          }
        }

        return {
          message: userMessage,
          aiResponse,
          analysisResult,
          draftResult
        }
      }, 'ai', {
        progressId: 'send_message',
        progressSteps: ['Processing message...', 'Analyzing content...', 'Generating response...', 'Finalizing...']
      })
    }
  },

  async getSessions(limit: number = 10): Promise<ApiResponse<ChatSessionResponse[]> | ApiError> {
    return mockClient.request(async () => {
      return mockChatSessions.slice(0, limit)
    }, 'fast')
  }
}

// Document Endpoints
export const documentsApi = {
  async upload(
    request: UploadDocumentRequest,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<UploadDocumentResponse> | ApiError> {
    try {
      // Use real API for document upload
      const uploadResult = await realApiClient.uploadDocument(request.file, onProgress)
      
      return {
        success: true,
        data: uploadResult,
        timestamp: new Date().toISOString(),
        message: 'Document uploaded successfully'
      }
    } catch (error) {
      console.error('Real API upload failed, falling back to mock:', error)
      
      // Fallback to mock implementation
      const uploadResult = await mockClient.uploadFile(request.file, onProgress)
      
      if (!uploadResult.success) {
        return uploadResult as ApiError
      }

      return mockClient.request(async () => {
        const document: Document = {
          id: uploadResult.data.fileId,
          originalFilename: request.file.name,
          storedFilename: `${uploadResult.data.fileId}.${request.file.name.split('.').pop()}`,
          fileType: request.file.type,
          fileSize: request.file.size,
          s3Bucket: 'legalkaki-documents',
          s3Key: `documents/user-1/${uploadResult.data.fileId}.${request.file.name.split('.').pop()}`,
          uploadDate: new Date(),
          analysisStatus: 'pending'
        }

        return {
          document,
          uploadUrl: uploadResult.data.url,
          analysisJobId: `analysis_job_${Date.now()}`
        }
      }, 'fast', {
        successMessage: 'Document uploaded successfully (mock)'
      })
    }
  },

  async getDocument(documentId: string): Promise<ApiResponse<Document> | ApiError> {
    return mockClient.request(async () => {
      const document = mockDocuments.find(d => d.id === documentId)
      if (!document) {
        throw new Error('Document not found')
      }
      return document
    }, 'fast')
  },

  async getDocuments(limit: number = 10): Promise<ApiResponse<Document[]> | ApiError> {
    return mockClient.request(async () => {
      return mockDocuments.slice(0, limit)
    }, 'fast')
  },

  async analyzeDocument(
    documentId: string,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<ApiResponse<AnalysisResult> | ApiError> {
    return mockClient.processWithAI(
      `Analyzing document ${documentId}`,
      'analysis',
      onProgress
    ).then(result => {
      if (!result.success) return result as ApiError
      
      return mockClient.request(async () => {
        return {
          ...mockAnalysisResult,
          id: result.data.resultId
        } as AnalysisResult
      }, 'fast')
    })
  },

  async deleteDocument(documentId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      return { success: true }
    }, 'fast', {
      successMessage: 'Document deleted successfully'
    })
  }
}

// Collections Endpoints
export const collectionsApi = {
  async getCollections(filters?: {
    status?: 'active' | 'archived' | 'completed'
    domain?: LegalDomain
    search?: string
    limit?: number
  }): Promise<ApiResponse<Collection[]> | ApiError> {
    return mockClient.request(async () => {
      let filtered = [...mockCollections]
      
      if (filters?.status) {
        filtered = filtered.filter(c => c.status === filters.status)
      }
      
      if (filters?.domain) {
        filtered = filtered.filter(c => c.domain === filters.domain)
      }
      
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        filtered = filtered.filter(c => 
          c.title.toLowerCase().includes(searchTerm) ||
          c.domain.toLowerCase().includes(searchTerm) ||
          c.summary.toLowerCase().includes(searchTerm)
        )
      }
      
      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit)
      }
      
      return filtered
    }, 'fast')
  },

  async getCollection(collectionId: string): Promise<ApiResponse<Collection> | ApiError> {
    return mockClient.request(async () => {
      const collection = mockCollections.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }
      return collection
    }, 'fast')
  },

  async createCollection(request: CreateCollectionRequest): Promise<ApiResponse<Collection> | ApiError> {
    return mockClient.request(async () => {
      const collectionId = `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      
      const collection: Collection = {
        id: collectionId,
        title: request.title,
        domain: request.domain,
        summary: request.summary || '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        itemCount: 0,
        messageCount: 0,
        documentCount: 0,
        actionItemsCount: 0,
        urgentActionsCount: 0,
        tags: request.tags || []
      }
      
      return collection
    }, 'medium', {
      successMessage: 'Collection created successfully'
    })
  },

  async updateCollection(
    collectionId: string, 
    updates: Partial<Collection>
  ): Promise<ApiResponse<Collection> | ApiError> {
    return mockClient.request(async () => {
      const collection = mockCollections.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }
      
      const updated = { ...collection, ...updates, updatedAt: new Date() }
      return updated
    }, 'medium', {
      successMessage: 'Collection updated successfully'
    })
  },

  async deleteCollection(collectionId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      return { success: true }
    }, 'fast', {
      successMessage: 'Collection deleted successfully'
    })
  },

  async getCollectionConversations(collectionId: string): Promise<ApiResponse<ChatSessionResponse[]> | ApiError> {
    return mockClient.request(async () => {
      // Filter conversations that belong to this collection
      const conversations = mockChatSessions.filter(session => 
        session.collectionId === collectionId
      )
      return conversations
    }, 'fast')
  },

  async getCollectionDocuments(collectionId: string): Promise<ApiResponse<Document[]> | ApiError> {
    return mockClient.request(async () => {
      // Filter documents that belong to this collection
      const documents = mockDocuments.filter(doc => 
        doc.collectionId === collectionId
      )
      return documents
    }, 'fast')
  },

  async getCollectionActions(collectionId: string): Promise<ApiResponse<ActionItem[]> | ApiError> {
    return mockClient.request(async () => {
      // Filter action items that belong to this collection
      const actions = mockActionItems.filter(action => 
        action.collectionId === collectionId
      )
      return actions
    }, 'fast')
  },

  async getCollectionDashboard(collectionId: string): Promise<ApiResponse<{
    collection: Collection
    conversations: ChatSessionResponse[]
    documents: Document[]
    actionItems: ActionItem[]
    stats: {
      totalConversations: number
      totalDocuments: number
      totalActions: number
      urgentActions: number
      completedActions: number
    }
  }> | ApiError> {
    return mockClient.request(async () => {
      const collection = mockCollections.find(c => c.id === collectionId)
      if (!collection) {
        throw new Error('Collection not found')
      }

      const conversations = mockChatSessions.filter(session => 
        session.collectionId === collectionId
      )
      
      const documents = mockDocuments.filter(doc => 
        doc.collectionId === collectionId
      )
      
      const actionItems = mockActionItems.filter(action => 
        action.collectionId === collectionId
      )

      const stats = {
        totalConversations: conversations.length,
        totalDocuments: documents.length,
        totalActions: actionItems.length,
        urgentActions: actionItems.filter(a => a.priority === 'urgent' && a.status !== 'completed').length,
        completedActions: actionItems.filter(a => a.status === 'completed').length
      }

      return {
        collection,
        conversations,
        documents,
        actionItems,
        stats
      }
    }, 'fast')
  },

  async addConversationToCollection(collectionId: string, conversationId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      // In a real implementation, this would update the database
      // to link the conversation to the collection
      return { success: true }
    }, 'medium', {
      successMessage: 'Conversation added to collection'
    })
  },

  async addDocumentToCollection(collectionId: string, documentId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      // In a real implementation, this would update the database
      // to link the document to the collection
      return { success: true }
    }, 'medium', {
      successMessage: 'Document added to collection'
    })
  },

  async removeConversationFromCollection(collectionId: string, conversationId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      // In a real implementation, this would update the database
      // to unlink the conversation from the collection
      return { success: true }
    }, 'medium', {
      successMessage: 'Conversation removed from collection'
    })
  },

  async removeDocumentFromCollection(collectionId: string, documentId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      // In a real implementation, this would update the database
      // to unlink the document from the collection
      return { success: true }
    }, 'medium', {
      successMessage: 'Document removed from collection'
    })
  }
}

// Action Items Endpoints
export const actionsApi = {
  async getActions(filters?: {
    status?: 'pending' | 'in_progress' | 'completed'
    priority?: 'urgent' | 'important' | 'normal'
    collectionId?: string
    limit?: number
  }): Promise<ApiResponse<ActionItem[]> | ApiError> {
    return mockClient.request(async () => {
      let filtered = [...mockActionItems]
      
      if (filters?.status) {
        filtered = filtered.filter(a => a.status === filters.status)
      }
      
      if (filters?.priority) {
        filtered = filtered.filter(a => a.priority === filters.priority)
      }
      
      if (filters?.collectionId) {
        // In a real app, this would filter by collection
        filtered = filtered.filter(a => a.sourceConversation?.includes('Employment'))
      }
      
      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit)
      }
      
      return filtered
    }, 'fast')
  },

  async getAction(actionId: string): Promise<ApiResponse<ActionItem> | ApiError> {
    return mockClient.request(async () => {
      const action = mockActionItems.find(a => a.id === actionId)
      if (!action) {
        throw new Error('Action not found')
      }
      return action
    }, 'fast')
  },

  async createAction(request: CreateActionItemRequest): Promise<ApiResponse<ActionItem> | ApiError> {
    return mockClient.request(async () => {
      const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const action: ActionItem = {
        id: actionId,
        title: request.title,
        description: request.description,
        priority: request.priority,
        status: 'pending',
        dueDate: request.dueDate,
        externalLinks: request.externalLinks,
        sourceConversation: request.sourceConversation
      }
      
      return action
    }, 'medium', {
      successMessage: 'Action item created successfully'
    })
  },

  async updateAction(
    actionId: string, 
    updates: UpdateActionItemRequest
  ): Promise<ApiResponse<ActionItem> | ApiError> {
    return mockClient.request(async () => {
      const action = mockActionItems.find(a => a.id === actionId)
      if (!action) {
        throw new Error('Action not found')
      }
      
      const updated = { ...action, ...updates }
      return updated
    }, 'medium', {
      successMessage: 'Action item updated successfully'
    })
  },

  async deleteAction(actionId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> {
    return mockClient.request(async () => {
      return { success: true }
    }, 'fast', {
      successMessage: 'Action item deleted successfully'
    })
  }
}

// Search Endpoints
export const searchApi = {
  async search(request: SearchRequest): Promise<ApiResponse<SearchResponse> | ApiError> {
    return mockClient.request(async () => {
      // Simulate search logic
      const results = [
        {
          id: '1',
          type: 'conversation' as const,
          title: 'Employment Contract Review',
          snippet: 'Discussion about employment contract terms and compliance...',
          relevanceScore: 0.95,
          domain: 'employment' as LegalDomain,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          type: 'document' as const,
          title: 'Employment_Contract_2024.pdf',
          snippet: 'PDF document containing employment contract details...',
          relevanceScore: 0.87,
          domain: 'employment' as LegalDomain,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ]
      
      const filtered = results.filter(r => 
        r.title.toLowerCase().includes(request.query.toLowerCase()) ||
        r.snippet.toLowerCase().includes(request.query.toLowerCase())
      )
      
      return {
        results: filtered,
        totalResults: filtered.length,
        searchTime: 0.25,
        suggestions: ['employment contract', 'salary compliance', 'termination clauses'],
        pagination: {
          page: request.pagination?.page || 1,
          limit: request.pagination?.limit || 10,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / (request.pagination?.limit || 10))
        }
      }
    }, 'medium')
  }
}

// Reports & Tools Endpoints
export const toolsApi = {
  async generateReport(request: GenerateReportRequest): Promise<ApiResponse<GenerateReportResponse> | ApiError> {
    return mockClient.request(async () => {
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        reportId,
        downloadUrl: `#/reports/${reportId}`,
        reportType: request.reportType,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    }, 'slow', {
      successMessage: 'Report generated successfully',
      progressId: 'generate_report',
      progressSteps: ['Collecting data...', 'Processing information...', 'Generating report...', 'Finalizing document...']
    })
  },

  async generateMindmap(collectionId: string): Promise<ApiResponse<{ mindmapUrl: string }> | ApiError> {
    return mockClient.request(async () => {
      return {
        mindmapUrl: `#/mindmap/${collectionId}`
      }
    }, 'slow', {
      successMessage: 'Mind map generated successfully'
    })
  },

  async generateMindMapInsights(request: {
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
  }): Promise<ApiResponse<{
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
  }> | ApiError> {
    return mockClient.request(async () => {
      // Call Bedrock service for real AI analysis (server-side only)
      const analysisRequest: MindMapAnalysisRequest = {
        collectionTitle: request.collectionTitle,
        collectionDomain: request.collectionDomain,
        collectionSummary: request.collectionSummary,
        conversations: request.conversations,
        documents: request.documents,
        actionItems: request.actionItems
      }
      
      const result = await bedrockService.generateMindMapInsights(analysisRequest)
      return result
    }, 'ai', {
      successMessage: 'Mind map insights generated'
    })
  }
}

// PDF Analysis Endpoints
export const pdfApi = {
  async getDocumentUrl(documentId: string): Promise<ApiResponse<{ url: string }> | ApiError> {
    return mockClient.request(async () => {
      // For the sample PDF, return the local path
      if (documentId === '550e8400-e29b-41d4-a716-446655440001') {
        return { url: '/partnership.pdf' }
      }
      
      // For other documents, you would typically fetch from S3
      const document = mockDocuments.find(d => d.id === documentId)
      if (!document) {
        throw new Error('Document not found')
      }
      
      // In production, this would be a signed S3 URL
      return { url: `/documents/${document.storedFilename}` }
    }, 'fast')
  },

  async analyzeTextSelection(request: {
    documentId: string
    selectedText: string
    context?: string
    pageNumber?: number
  }): Promise<ApiResponse<{
    explanation: string
    category: 'clause' | 'legal-term' | 'obligation' | 'right' | 'warning' | 'general'
    confidence: number
  }> | ApiError> {
    return mockClient.request(async () => {
      // Call Bedrock service for real AI analysis
      const analysisRequest: TextAnalysisRequest = {
        selectedText: request.selectedText,
        context: request.context,
        documentType: 'legal document',
        pageNumber: request.pageNumber
      }
      
      const result = await bedrockService.analyzeText(analysisRequest)
      return result
    }, 'ai', {
      successMessage: 'Text analysis completed'
    })
  },

  async getDocumentMetadata(documentId: string): Promise<ApiResponse<{
    pageCount: number
    textContent?: string
    hasTextLayer: boolean
  }> | ApiError> {
    return mockClient.request(async () => {
      const document = mockDocuments.find(d => d.id === documentId)
      if (!document) {
        throw new Error('Document not found')
      }
      
      // Return metadata for the PDF
      return {
        pageCount: document.metadata?.pages || 1,
        hasTextLayer: true,
        textContent: undefined // Would be extracted from PDF in production
      }
    }, 'fast')
  }
}

// Combine all APIs
export const api = {
  auth: authApi,
  user: userApi,
  domains: domainsApi,
  chat: chatApi,
  documents: documentsApi,
  collections: collectionsApi,
  actions: actionsApi,
  search: searchApi,
  tools: toolsApi,
  pdf: pdfApi
}

export default api