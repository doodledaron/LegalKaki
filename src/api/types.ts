import { LegalDomain, ActionItem, Document, Message } from '@/types'

// Mapping functions to convert backend data to frontend models
export function mapBackendCollectionToCollection(backend: BackendCollection): Collection {
  return {
    id: backend.collection_id.toString(),
    title: backend.name,
    domain: 'general' as LegalDomain, // Default domain since backend doesn't provide this
    summary: '', // Backend doesn't provide summary
    status: mapBackendStatusToStatus(backend.status),
    createdAt: new Date(backend.created_at),
    updatedAt: new Date(backend.created_at), // Use created_at as updated_at since backend doesn't provide it
    itemCount: 0, // Will be calculated from related data
    messageCount: 0, // Will be calculated from chats
    documentCount: 0, // Will be calculated from documents
    actionItemsCount: 0, // Will be calculated from actions
    urgentActionsCount: 0, // Will be calculated from actions
    tags: [], // Backend doesn't provide tags
  }
}

export function mapBackendChatToChatSession(backend: BackendChat): ChatSessionResponse {
  return {
    id: backend.chat_id.toString(),
    domain: 'general' as LegalDomain, // Default domain since backend doesn't provide this
    title: backend.chat_name,
    messages: [], // Backend doesn't provide messages in collection details
    createdAt: new Date(backend.started_at),
    updatedAt: new Date(backend.started_at),
    status: mapBackendStatusToChatStatus(backend.status),
  }
}

export function mapBackendActionToActionItem(backend: BackendAction): ActionItem {
  console.log('🔄 Mapping Backend Action:', {
    id: backend.action_id,
    title: backend.title,
    description: backend.description,
    descriptionType: typeof backend.description,
    external_url: backend.external_url,
    external_url_type: typeof backend.external_url,
    external_url_length: backend.external_url?.length,
    category: backend.category
  })
  
  const externalLinks: Array<{ text: string; url: string }> = []
  
  // Use the external_url from backend if it's provided and not just "string"
  // If external_url is 'string', it means there is no external URL
  const trimmedUrl = backend.external_url?.trim()
  
  // Debug URL validation
  console.log('🔍 URL Validation:', {
    originalUrl: backend.external_url,
    trimmedUrl: trimmedUrl,
    isValid: trimmedUrl && trimmedUrl !== 'string' && trimmedUrl.startsWith('http')
  })
  
  // Only use real backend URLs - validate they are proper HTTP/HTTPS URLs
  if (backend.external_url && 
      trimmedUrl && 
      trimmedUrl !== 'string' &&
      trimmedUrl.length > 0 &&
      (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
    console.log('✅ Adding backend external URL:', backend.external_url)
    externalLinks.push({
      text: 'View Resource',
      url: trimmedUrl
    })
  } else {
    console.log('❌ Skipping backend external URL:', backend.external_url, {
      hasUrl: !!backend.external_url,
      trimmedUrl: trimmedUrl,
      isStringLiteral: trimmedUrl === 'string',
      isEmpty: trimmedUrl === '',
      isLengthZero: trimmedUrl?.length === 0,
      startsWithHttp: trimmedUrl?.startsWith('http')
    })
  }
  
  // Only use real backend URLs - no generated links
  
  const mappedAction = {
    id: backend.action_id.toString(),
    title: backend.title,
    description: backend.description || '', // Use description from backend
    priority: mapBackendCategoryToPriority(backend.category),
    status: mapBackendStatusToActionStatus(backend.status),
    dueDate: backend.due_at ? new Date(backend.due_at) : undefined,
    externalLinks,
    sourceConversation: undefined, // Backend doesn't provide source conversation
  }
  
  console.log('✅ Mapped Action Result:', {
    id: mappedAction.id,
    title: mappedAction.title,
    description: mappedAction.description,
    externalLinksCount: mappedAction.externalLinks.length,
    externalLinks: mappedAction.externalLinks,
    backendExternalUrl: backend.external_url,
    hasBackendUrl: !!backend.external_url,
    backendUrlIsString: backend.external_url === 'string'
  })
  
  return mappedAction
}


export function mapBackendDocumentToDocument(backend: BackendDocument): Document {
  // Debug: Log backend document data
  console.log('📄 Mapping Backend Document:', {
    document_id: backend.document_id,
    filename: backend.filename,
    filenameType: typeof backend.filename,
    file_type: backend.file_type,
    file_size: backend.file_size
  })
  
  // Safely handle filename and extension
  const filename = backend.filename || 'unknown_file'
  const fileExtension = filename.includes('.') ? filename.split('.').pop() : 'unknown'
  
  return {
    id: backend.document_id.toString(),
    originalFilename: filename,
    storedFilename: `${backend.document_id}.${fileExtension}`,
    fileType: backend.file_type || 'application/octet-stream',
    fileSize: backend.file_size || 0,
    s3Bucket: 'legalkaki-documents', // Default bucket name
    s3Key: backend.s3_key || `documents/user-${backend.owner_sub}/${backend.document_id}.${fileExtension}`,
    uploadDate: new Date(backend.upload_date),
    analysisStatus: mapBackendDocumentStatusToAnalysisStatus(backend.analysis_status || backend.status),
    contentSummary: backend.content_summary,
    collectionId: undefined, // Will be set by the calling function
    metadata: {
      pages: undefined, // Backend doesn't provide page count
      language: 'en', // Default language
      wordCount: undefined, // Backend doesn't provide word count
    }
  }
}

// Map collection documents from the collection details endpoint to frontend Document format
export function mapBackendCollectionDocumentToDocument(backend: BackendCollectionDocument, collectionId: number): Document {
  // Debug: Log backend collection document data
  console.log('📄 Mapping Backend Collection Document:', {
    document_id: backend.document_id,
    title: backend.title,
    s3_bucket: backend.s3_bucket,
    s3_key: backend.s3_key,
    source_type: backend.source_type,
    created_at: backend.created_at
  })
  
  // Safely handle filename and extension
  const filename = backend.title || 'unknown_file'
  const fileExtension = filename.includes('.') ? filename.split('.').pop() : 'unknown'
  
  return {
    id: backend.document_id.toString(),
    originalFilename: filename,
    storedFilename: `${backend.document_id}.${fileExtension}`,
    fileType: 'application/pdf', // Default to PDF since most legal documents are PDFs
    fileSize: 0, // Not provided in collection details
    s3Bucket: backend.s3_bucket,
    s3Key: backend.s3_key,
    uploadDate: new Date(backend.created_at),
    analysisStatus: 'pending' as const, // Default status since not provided
    contentSummary: undefined, // Not provided by collection details endpoint
    collectionId: collectionId.toString(),
    metadata: {
      pages: undefined, // Not provided by collection details endpoint
      language: 'en', // Default language
      wordCount: undefined, // Not provided by collection details endpoint
      sourceType: backend.source_type,
      uploadedInChatId: backend.uploaded_in_chat_id
    }
  }
}

// Helper mapping functions
function mapBackendStatusToStatus(backendStatus: string): 'active' | 'archived' | 'completed' {
  switch (backendStatus.toLowerCase()) {
    case 'active':
      return 'active'
    case 'archived':
      return 'archived'
    case 'completed':
      return 'completed'
    default:
      return 'active'
  }
}

function mapBackendStatusToChatStatus(backendStatus: string): 'active' | 'archived' {
  switch (backendStatus.toLowerCase()) {
    case 'active':
      return 'active'
    case 'archived':
    case 'completed':
      return 'archived'
    default:
      return 'active'
  }
}

function mapBackendCategoryToPriority(backendCategory: string): 'urgent' | 'important' | 'normal' {
  switch (backendCategory.toLowerCase()) {
    case 'urgent':
      return 'urgent'
    case 'important':
      return 'important'
    case 'normal':
    default:
      return 'normal'
  }
}

function mapBackendStatusToActionStatus(backendStatus: string): 'pending' | 'in_progress' | 'completed' {
  switch (backendStatus.toLowerCase()) {
    case 'pending':
      return 'pending'
    case 'in_progress':
    case 'processing':
      return 'in_progress'
    case 'completed':
      return 'completed'
    default:
      return 'pending'
  }
}

function mapBackendDocumentStatusToAnalysisStatus(backendStatus: string): 'pending' | 'processing' | 'completed' | 'error' {
  switch (backendStatus.toLowerCase()) {
    case 'pending':
      return 'pending'
    case 'processing':
    case 'analyzing':
      return 'processing'
    case 'completed':
    case 'analyzed':
      return 'completed'
    case 'error':
    case 'failed':
      return 'error'
    default:
      return 'pending'
  }
}

// Backend Collection Response Types
export interface BackendCollection {
  collection_id: number
  owner_sub: string
  name: string
  status: string
  created_at: string
}

export interface BackendChat {
  chat_id: number
  user_sub: string
  chat_name: string
  status: string
  started_at: string
}

export interface BackendAction {
  action_id: number
  owner_sub: string
  title: string
  description: string
  category: string
  status: string
  external_url: string
  due_at: string
  created_from_chat_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface BackendCollectionDetails {
  collection: BackendCollection
  chats: BackendChat[]
  documents: BackendCollectionDocument[]
  actions: BackendAction[]
}

// Document structure from collection details endpoint
export interface BackendCollectionDocument {
  document_id: number
  owner_sub: string
  uploaded_in_chat_id: number
  title: string
  s3_bucket: string
  s3_key: string
  source_type: string
  created_at: string
}


export interface BackendDocument {
  document_id: number
  owner_sub: string
  chat_id: number
  filename: string
  file_type: string
  file_size: number
  upload_date: string
  status: string
  s3_key?: string
  analysis_status?: string
  content_summary?: string
}

// Collection Dashboard Data Type
export interface CollectionDashboardData {
  collection: Collection
  documents: Document[]
  conversations: ChatSessionResponse[]
  actionItems: ActionItem[]
  stats: {
    totalConversations: number
    totalDocuments: number
    totalActions: number
    urgentActions: number
    completedActions: number
  }
}
  
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

// Mind Map Generation Types
export interface MindMapBackendResponse {
  success: boolean
  collection_id: number
  collection_name: string
  agent_response: string | {
    version: string
    generatedAt: string
    type: string
    title: string
    summary: string
    data: Record<string, unknown>
  }
  session_id: string
  traces_count: number
  traces: unknown | null
}

export interface MindMapGenerationResponse {
  collectionId: string
  collectionName: string
  agentResponse: {
    version: string
    generatedAt: string
    type: string
    title: string
    summary: string
    data: Record<string, unknown>
  }
  sessionId: string
  tracesCount: number
}