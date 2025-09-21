import { LegalDomain, ActionItem, Document, Message } from '@/types'

// Base API Response Types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export interface ApiError {
  success: false
  error: string
  code: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// User Types
export interface User {
  id: string
  email?: string
  name: string
  avatar?: string
  preferences: UserPreferences
  createdAt: Date
  lastLoginAt?: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    push: boolean
    urgentActions: boolean
  }
  defaultDomain?: LegalDomain
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  user: User
  token: string
  expiresAt: Date
}

// Domain Types
export interface DomainInfo {
  id: LegalDomain
  title: string
  description: string
  examples: string[]
  color: string
  icon: string
  isAvailable: boolean
}

// Chat Types
export interface CreateChatSessionRequest {
  domain: LegalDomain
  initialMessage?: string
}

export interface ChatSessionResponse {
  id: string
  domain: LegalDomain
  title?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'archived'
}

export interface SendMessageRequest {
  content: string
  attachments?: string[] // document IDs
  messageType?: 'text' | 'analysis_request' | 'draft_request'
}

export interface SendMessageResponse {
  message: Message
  aiResponse?: Message
  analysisResult?: AnalysisResult
  draftResult?: DraftResult
  modeSwitch?: {
    detected: boolean
    mode: "A" | "B" | "C" | null
    toDraftMode: boolean
    toAnalysisMode: boolean
    structuredData?: {
      Mode: "A" | "B" | "C"
      answer: string
      steps?: string[]
      source?: string
    }
  }
}

export interface AnalysisResult {
  id: string
  explanation: string
  risks: RiskIndicator[]
  keyPoints: string[]
  actionItems: ActionItem[]
  confidence: number
  processingTime: number
}

export interface RiskIndicator {
  level: 'high' | 'medium' | 'low'
  description: string
  recommendation?: string
  urgency: number
}

export interface DraftResult {
  id: string
  documentType: string
  content: string
  suggestions: DraftSuggestion[]
  disclaimer: string
  templateUsed?: string
}

export interface DraftSuggestion {
  section: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  reasoning: string
}

// Document Types
export interface UploadDocumentRequest {
  file: File
  sessionId?: string
  tags?: string[]
}

export interface UploadDocumentResponse {
  document: Document
  uploadUrl?: string
  analysisJobId?: string
}

export interface DocumentAnalysisResponse {
  id: string
  documentId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  results?: {
    contentSummary: string
    keyTerms: string[]
    potentialIssues: string[]
    recommendations: string[]
    confidence: number
  }
  error?: string
  completedAt?: Date
}

// Collection Types
export interface Collection {
  id: string
  title: string
  domain: LegalDomain
  summary: string
  status: 'active' | 'archived' | 'completed'
  createdAt: Date
  updatedAt: Date
  itemCount: number
  messageCount: number
  documentCount: number
  actionItemsCount: number
  urgentActionsCount: number
  tags: string[]
}

export interface CreateCollectionRequest {
  title: string
  domain: LegalDomain
  summary?: string
  tags?: string[]
}

export interface AddToCollectionRequest {
  collectionId: string
  itemId: string
  itemType: 'conversation' | 'document' | 'action'
  notes?: string
}

// Action Items Types
export interface CreateActionItemRequest {
  title: string
  description: string
  priority: 'urgent' | 'important' | 'normal'
  dueDate?: Date
  sourceConversation?: string
  collectionId?: string
  externalLinks?: ExternalLink[]
}

export interface UpdateActionItemRequest {
  title?: string
  description?: string
  priority?: 'urgent' | 'important' | 'normal'
  status?: 'pending' | 'in_progress' | 'completed'
  dueDate?: Date
  notes?: string
}

export interface ExternalLink {
  text: string
  url: string
  description?: string
}

// Statistics Types
export interface UserStats {
  totalCollections: number
  activeCollections: number
  totalActions: number
  urgentActions: number
  documentsAnalyzed: number
  conversationsCount: number
  joinedDate: Date
  lastActivity: Date
}

export interface DashboardStats {
  user: UserStats
  recentActivity: ActivityItem[]
  upcomingDeadlines: ActionItem[]
  systemStatus: SystemStatus
}

export interface ActivityItem {
  id: string
  type: 'message' | 'document_upload' | 'action_created' | 'collection_created'
  description: string
  timestamp: Date
  relatedId?: string
}

export interface SystemStatus {
  status: 'operational' | 'maintenance' | 'degraded'
  message?: string
  lastUpdated: Date
}

// Search Types
export interface SearchRequest {
  query: string
  filters?: {
    domains?: LegalDomain[]
    dateRange?: {
      start: Date
      end: Date
    }
    itemTypes?: ('conversation' | 'document' | 'action')[]
    status?: string[]
  }
  pagination?: {
    page: number
    limit: number
  }
}

export interface SearchResult {
  id: string
  type: 'conversation' | 'document' | 'action' | 'collection'
  title: string
  snippet: string
  relevanceScore: number
  domain: LegalDomain
  createdAt: Date
  metadata?: Record<string, unknown>
}

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
  suggestions?: string[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Tool Types
export interface GenerateReportRequest {
  collectionId?: string
  reportType: 'summary' | 'mindmap' | 'timeline' | 'action_plan'
  includeDocuments: boolean
  includeConversations: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface GenerateReportResponse {
  reportId: string
  downloadUrl: string
  reportType: string
  generatedAt: Date
  expiresAt: Date
}

// WebSocket Types for Real-time Updates
export interface WebSocketMessage {
  type: 'analysis_update' | 'document_processed' | 'action_reminder' | 'system_notification'
  payload: unknown
  timestamp: Date
  id: string
}

export interface AnalysisUpdatePayload {
  analysisId: string
  status: 'processing' | 'completed' | 'error'
  progress?: number
  results?: AnalysisResult
}