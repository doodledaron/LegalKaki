// TypeScript interfaces matching JSON schemas from AWS Bedrock sub-agents
// These schemas enable structured rendering of AI responses in the frontend

// ============================================================================
// EDUCATOR SUB-AGENT SCHEMA (Explanation Tab)
// ============================================================================

export interface EducatorResponse {
  version: string
  generatedAt: string
  concept: string
  simpleDefinition: string
  keyPoints: string[]
  nuances: string[]
  examples: EducatorExample[]
  relatedConcepts: RelatedConcept[]
}

export interface EducatorExample {
  title: string
  description: string
}

export interface RelatedConcept {
  name: string
  whyRelated: string
}

// ============================================================================
// ANALYST SUB-AGENT SCHEMA (Analysis Tab)
// ============================================================================

export interface AnalystResponse {
  version: string
  generatedAt: string
  situationSummary: string
  issues: AnalystIssue[]
  relevantLaw: RelevantLaw
  assessment: LegalAssessment
}

export interface AnalystIssue {
  id: string
  name: string
  severity: 'high' | 'medium' | 'low'
  confidence: number
  considerations: string[]
}

export interface RelevantLaw {
  statutes: Statute[]
  cases: CaseLaw[]
  procedures: Procedure[]
  jurisdiction: string | null
}

export interface Statute {
  citation: string
  summary: string
}

export interface CaseLaw {
  name: string
  holding: string
}

export interface Procedure {
  topic: string
  detail: string
}

export interface LegalAssessment {
  positionStrength: 'STRONG' | 'MODERATE' | 'WEAK' | 'NEEDS_MORE_INFO'
  strengths: string[]
  weaknesses: string[]
  missingInformation: string[]
  timeSensitive: string[]
  docsNeeded: string[]
  disclaimers: string[]
}

// ============================================================================
// ADVISOR SUB-AGENT SCHEMA (Action Tab)
// ============================================================================

export interface AdvisorResponse {
  version: string
  generatedAt: string
  summary: string
  disclaimers: string[]
  items: AdvisorActionItem[]
}

export interface AdvisorActionItem {
  id: string
  title: string
  whatToDo: string
  whyItMatters: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'high' | 'medium' | 'low'
  due?: string // YYYY-MM-DD format
  estimatedHours?: number
  dependencies: string[]
  tags: string[]
  links: AdvisorLink[]
  requiredDocuments: string[]
  jurisdiction?: string
}

export interface AdvisorLink {
  label: string
  url: string
}

// ============================================================================
// VISUALIZATION SUB-AGENT SCHEMA (Supplementary Tab)
// ============================================================================

export type VisualizationType =
  | 'timeline'
  | 'document_summary'
  | 'comparison'
  | 'process_map'
  | 'checklist'
  | 'graph'
  | 'mindmap'

export interface VisualizationResponse {
  version: string
  generatedAt: string
  type: VisualizationType
  title: string
  summary: string
  data: VisualizationData
}

// Union type for different visualization data structures
export type VisualizationData =
  | TimelineData
  | DocumentSummaryData
  | ComparisonData
  | ProcessMapData
  | ChecklistData
  | GraphData
  | MindmapData

export interface TimelineData {
  events: TimelineEvent[]
}

export interface TimelineEvent {
  date: string
  title: string
  description: string
  type?: string
}

export interface DocumentSummaryData {
  documentType: string
  keyTerms: KeyTerm[]
  parties: Party[]
  obligations: Obligation[]
  risks: Risk[]
}

export interface KeyTerm {
  term: string
  description: string
  page?: number
}

export interface Party {
  name: string
  role: string
}

export interface Obligation {
  party: string
  description: string
  deadline?: string
}

export interface Risk {
  description: string
  severity: 'high' | 'medium' | 'low'
  mitigation?: string
}

export interface ComparisonData {
  columns: string[]
  rows: ComparisonRow[]
}

export interface ComparisonRow {
  label: string
  values: string[]
}

export interface ProcessMapData {
  steps: ProcessStep[]
}

export interface ProcessStep {
  id: string
  title: string
  description: string
  next?: string[]
}

export interface ChecklistData {
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  required: boolean
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  layout?: 'hierarchical' | 'force' | 'circular'
}

export interface GraphNode {
  id: string
  label: string
  type?: string
}

export interface GraphEdge {
  from: string
  to: string
  label?: string
}

export interface MindmapData {
  root: MindmapNode
}

export interface MindmapNode {
  id: string
  label: string
  children?: MindmapNode[]
}

// ============================================================================
// DRAFT SUB-AGENT SCHEMA (Supplementary Tab)
// ============================================================================

export type DocumentType =
  | 'demand_letter'
  | 'nda'
  | 'employment_contract'
  | 'lease'
  | 'custom'

export interface DraftResponse {
  version: string
  generatedAt: string
  documentType: DocumentType
  title: string
  jurisdiction: string | null
  parties: DraftParty[]
  placeholders: DraftPlaceholder[]
  sections: DraftSection[]
  signatures: DraftSignature[]
}

export interface DraftParty {
  role: 'sender' | 'recipient' | string
  name: string
  address?: string
}

export interface DraftPlaceholder {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency'
  defaultValue?: string | number
}

export interface DraftSection {
  id: string
  title: string
  content?: string
}

export interface DraftSignature {
  role: string
  name: string
  title?: string
  date?: string
}

// ============================================================================
// COMBINED RESPONSE TYPES
// ============================================================================

// Type guard functions for runtime type checking
export function isEducatorResponse(data: unknown): data is EducatorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'concept' in data &&
    'simpleDefinition' in data
  )
}

export function isAnalystResponse(data: unknown): data is AnalystResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'situationSummary' in data &&
    'issues' in data &&
    'relevantLaw' in data
  )
}

export function isAdvisorResponse(data: unknown): data is AdvisorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as AdvisorResponse).items)
  )
}

export function isVisualizationResponse(
  data: unknown
): data is VisualizationResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'data' in data
  )
}

export function isDraftResponse(data: unknown): data is DraftResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'documentType' in data &&
    'sections' in data
  )
}
