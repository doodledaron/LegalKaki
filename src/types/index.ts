// Domain Types
export type LegalDomain = 'business' | 'employment' | 'property' | 'marriage' | 'general'

// Message Types
export interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  attachments?: FileAttachment[]
  domain?: LegalDomain
  type?: 'text' | 'analysis' | 'draft'
}

export interface FileAttachment {
  id: string
  filename: string
  fileType: string
  fileSize: number
  url: string
}

// Action Item Types
export type ActionPriority = 'urgent' | 'important' | 'normal'
export type ActionStatus = 'pending' | 'in_progress' | 'completed'

export interface ActionItem {
  id: string
  title: string
  description: string
  priority: ActionPriority
  status: ActionStatus
  dueDate?: Date
  externalLinks?: ExternalLink[]
  sourceConversation?: string
  steps?: ActionStep[]
}

export interface ActionStep {
  id: string
  instruction: string
  status: 'pending' | 'completed'
  order: number
}

export interface ExternalLink {
  text: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
}

// Document Types
export type DocumentAnalysisStatus = 'pending' | 'processing' | 'completed' | 'error'

export interface Document {
  id: string
  filename: string
  fileType: string
  fileSize: number
  uploadDate: Date
  analysisStatus: DocumentAnalysisStatus
  contentText?: string
  highlights?: DocumentHighlight[]
  thumbnail?: string
}

export interface DocumentHighlight {
  id: string
  text: string
  explanation: string
  position: {
    start: number
    end: number
  }
  legalContext?: string
  relatedActions?: string[]
}

// Collection Types
export interface CollectionItem {
  id: string
  type: 'conversation' | 'document' | 'action'
  title: string
  preview: string
  domain?: LegalDomain
  timestamp: Date
  metadata?: Record<string, unknown>
}

// Chat Types
export interface ChatSession {
  id: string
  domain: LegalDomain
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  title?: string
}

export interface ResponseAnalysis {
  explanation: string
  analysis: {
    risks: RiskIndicator[]
    keyPoints: string[]
  }
  actions: ActionItem[]
}

export interface RiskIndicator {
  level: 'high' | 'medium' | 'low'
  description: string
  icon: string
}

// UI Types
export interface TabItem {
  id: string
  label: string
  icon: string
  content: React.ReactNode
}

export interface CardItem {
  id: string
  emoji: string
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  examples: string[]
}

// Tool Types
export interface ToolResult {
  id: string
  type: 'mindmap' | 'report' | 'transcript'
  title: string
  content: unknown
  generatedAt: Date
}

// Navigation Types
export interface NavItem {
  id: string
  label: string
  icon: string
  route: string
  isActive?: boolean
}
