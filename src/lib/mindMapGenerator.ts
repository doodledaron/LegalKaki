import { Document, ActionItem } from '@/types'
import { bedrockService, MindMapInsights, MindMapAnalysisRequest } from '@/api/bedrockService'

export interface CollectionMindMapData {
  id: string
  title: string
  domain: string
  summary: string
  conversations: Array<{
    id: string
    title: string
    domain: string
    messages: unknown[]
  }>
  documents: Document[]
  actionItems: ActionItem[]
}

export interface InteractiveMindMapNode {
  id: string
  type: 'collection' | 'document' | 'conversation' | 'action' | 'insight' | 'theme'
  title: string
  clickable: boolean
  priority?: 'urgent' | 'important' | 'normal'
  status?: string
  navigationTarget?: {
    action: 'openDocument' | 'startChat' | 'showAction' | 'showInsight'
    data: any
  }
  icon?: string
  colorClass?: string
}

export interface EnhancedMindMapData {
  nodes: InteractiveMindMapNode[]
  insights: MindMapInsights
  mermaidCode: string
}

// Enhanced mind map generation with AI insights
export async function generateEnhancedMindMap(data: CollectionMindMapData): Promise<EnhancedMindMapData> {
  console.log('🧠 Generating enhanced AI mind map for:', data.title)
  
  try {
    // Prepare request for Bedrock AI analysis (direct client-side call for hackathon)
    const analysisRequest: MindMapAnalysisRequest = {
      collectionTitle: data.title,
      collectionDomain: data.domain,
      collectionSummary: data.summary,
      conversations: data.conversations,
      documents: data.documents.map(doc => ({
        id: doc.id,
        originalFilename: doc.originalFilename,
        contentSummary: doc.contentSummary
      })),
      actionItems: data.actionItems
    }
    
    // Get AI insights directly from Bedrock (client-side call)
    const insights = await bedrockService.generateMindMapInsights(analysisRequest)
    console.log('✨ AI insights generated:', insights)
    
    // Generate interactive nodes
    const nodes = generateInteractiveNodes(data, insights)
    
    // Generate Mermaid code with AI insights
    const mermaidCode = generateInteractiveMermaidCode(data, insights, nodes)
    
    return {
      nodes,
      insights,
      mermaidCode
    }
    
  } catch (error) {
    console.error('❌ Error generating enhanced mind map:', error)
    
    // Fallback to basic mind map
    const basicCode = generateBasicMindMapCode(data)
    return {
      nodes: generateBasicNodes(data),
      insights: {
        keyThemes: [],
        urgentActions: [],
        riskFactors: [],
        recommendations: [],
        connections: []
      },
      mermaidCode: basicCode
    }
  }
}

// Generate interactive nodes with navigation targets
function generateInteractiveNodes(data: CollectionMindMapData, insights: MindMapInsights): InteractiveMindMapNode[] {
  const nodes: InteractiveMindMapNode[] = []
  
  // Collection root node
  nodes.push({
    id: `collection_${data.id}`,
    type: 'collection',
    title: data.title,
    clickable: false
  })
  
  // AI Insight nodes
  insights.keyThemes.forEach(theme => {
    nodes.push({
      id: `theme_${theme.id}`,
      type: 'theme',
      title: theme.name,
      clickable: true,
      priority: theme.importance === 'high' ? 'urgent' : theme.importance === 'medium' ? 'important' : 'normal',
      navigationTarget: {
        action: 'showInsight',
        data: theme
      },
      icon: '🧠'
    })
  })
  
  // Document nodes
  data.documents.forEach(doc => {
    nodes.push({
      id: `document_${doc.id}`,
      type: 'document',
      title: cleanTextForNode(doc.originalFilename),
      clickable: true,
      navigationTarget: {
        action: 'openDocument',
        data: doc
      },
      icon: '📄'
    })
  })
  
  // Conversation nodes
  data.conversations.forEach(conv => {
    nodes.push({
      id: `conversation_${conv.id}`,
      type: 'conversation',
      title: cleanTextForNode(conv.title),
      clickable: true,
      navigationTarget: {
        action: 'startChat',
        data: conv
      },
      icon: '💬'
    })
  })
  
  // Action item nodes
  data.actionItems.forEach(action => {
    nodes.push({
      id: `action_${action.id}`,
      type: 'action',
      title: cleanTextForNode(action.title),
      clickable: true,
      priority: action.priority,
      status: action.status,
      navigationTarget: {
        action: 'showAction',
        data: action
      },
      icon: action.status === 'completed' ? '✅' : action.priority === 'urgent' ? '🚨' : '📝'
    })
  })
  
  return nodes
}

// Generate Mermaid code with interactive elements
function generateInteractiveMermaidCode(data: CollectionMindMapData, insights: MindMapInsights, nodes: InteractiveMindMapNode[]): string {
  const rootNode = cleanTextForNode(data.title)
  
  let mermaidCode = `mindmap
  root((${rootNode}))
`

  // AI Insights Section
  if (insights.keyThemes.length > 0) {
    mermaidCode += `    🧠 AI Insights
`
    insights.keyThemes.slice(0, 3).forEach(theme => {
      const themeTitle = cleanTextForNode(theme.name)
      mermaidCode += `      ${getIconForImportance(theme.importance)} ${themeTitle}
`
    })
  }
  
  // Risk Factors
  if (insights.riskFactors.length > 0) {
    mermaidCode += `    ⚠️ Risk Factors
`
    insights.riskFactors.slice(0, 2).forEach(risk => {
      const riskTitle = cleanTextForNode(risk.description)
      mermaidCode += `      ${getSeverityIcon(risk.severity)} ${riskTitle}
`
    })
  }
  
  // Documents Section
  if (data.documents.length > 0) {
    mermaidCode += `    📄 Documents
`
    data.documents.slice(0, 3).forEach(doc => {
      const docName = cleanTextForNode(doc.originalFilename)
      mermaidCode += `      ${docName}
`
    })
    
    if (data.documents.length > 3) {
      mermaidCode += `      ... ${data.documents.length - 3} more
`
    }
  }
  
  // Conversations Section
  if (data.conversations.length > 0) {
    mermaidCode += `    💬 Conversations
`
    data.conversations.slice(0, 2).forEach(conv => {
      const convTitle = cleanTextForNode(conv.title)
      mermaidCode += `      ${convTitle}
`
    })
  }
  
  // Action Items Section
  if (data.actionItems.length > 0) {
    mermaidCode += `    📝 Action Items
`
    
    const urgentActions = data.actionItems.filter(a => a.priority === 'urgent')
    const pendingActions = data.actionItems.filter(a => a.status === 'pending')
    const completedCount = data.actionItems.filter(a => a.status === 'completed').length
    
    if (urgentActions.length > 0) {
      mermaidCode += `      🚨 ${urgentActions.length} Urgent
`
      urgentActions.slice(0, 2).forEach(action => {
        const actionTitle = cleanTextForNode(action.title)
        mermaidCode += `        ${actionTitle}
`
      })
    }
    
    if (pendingActions.length > 0) {
      mermaidCode += `      📋 ${pendingActions.length} Pending
`
    }
    
    if (completedCount > 0) {
      mermaidCode += `      ✅ ${completedCount} Completed
`
    }
  }
  
  // AI Recommendations
  if (insights.recommendations.length > 0) {
    mermaidCode += `    💡 Recommendations
`
    insights.recommendations.slice(0, 2).forEach(rec => {
      const recTitle = cleanTextForNode(rec)
      mermaidCode += `      ${recTitle}
`
    })
  }
  
  console.log('📋 Enhanced Mermaid code generated:', mermaidCode)
  return mermaidCode
}

// Legacy function for backward compatibility (simplified version)
export function generateMindMapCode(data: CollectionMindMapData): string {
  return generateBasicMindMapCode(data)
}

// Basic mind map without AI insights (fallback)
function generateBasicMindMapCode(data: CollectionMindMapData): string {
  const rootNode = cleanTextForNode(data.title)
  
  let mermaidCode = `mindmap
  root((${rootNode}))
`

  // Add basic sections
  if (data.documents.length > 0) {
    mermaidCode += `    📄 Documents
      ${data.documents.length} files
`
  }
  
  if (data.conversations.length > 0) {
    mermaidCode += `    💬 Conversations
      ${data.conversations.length} active
`
  }
  
  if (data.actionItems.length > 0) {
    const urgentCount = data.actionItems.filter(a => a.priority === 'urgent').length
    const completedCount = data.actionItems.filter(a => a.status === 'completed').length
    
    mermaidCode += `    📝 Actions
      ${data.actionItems.length} total
`
    
    if (urgentCount > 0) {
      mermaidCode += `      🚨 ${urgentCount} urgent
`
    }
    
    if (completedCount > 0) {
      mermaidCode += `      ✅ ${completedCount} done
`
    }
  }
  
  return mermaidCode
}

// Generate basic nodes without AI insights
function generateBasicNodes(data: CollectionMindMapData): InteractiveMindMapNode[] {
  const nodes: InteractiveMindMapNode[] = []
  
  // Add basic nodes for each item type
  data.documents.forEach(doc => {
    nodes.push({
      id: `document_${doc.id}`,
      type: 'document',
      title: cleanTextForNode(doc.originalFilename),
      clickable: true,
      navigationTarget: {
        action: 'openDocument',
        data: doc
      },
      icon: '📄'
    })
  })
  
  data.conversations.forEach(conv => {
    nodes.push({
      id: `conversation_${conv.id}`,
      type: 'conversation',
      title: cleanTextForNode(conv.title),
      clickable: true,
      navigationTarget: {
        action: 'startChat',
        data: conv
      },
      icon: '💬'
    })
  })
  
  data.actionItems.forEach(action => {
    nodes.push({
      id: `action_${action.id}`,
      type: 'action',
      title: cleanTextForNode(action.title),
      clickable: true,
      priority: action.priority,
      status: action.status,
      navigationTarget: {
        action: 'showAction',
        data: action
      },
      icon: action.status === 'completed' ? '✅' : action.priority === 'urgent' ? '🚨' : '📝'
    })
  })
  
  return nodes
}

// Helper functions
function cleanTextForNode(text: string): string {
  return text
    .replace(/[()[\]{}]/g, '') // Remove brackets and parentheses
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[&<>]/g, '') // Remove HTML-like characters
    .replace(/[^\w\s-]/g, ' ') // Replace special characters with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .substring(0, 20) // Keep it short for mind map
}

function getIconForImportance(importance: string): string {
  switch (importance) {
    case 'high': return '🔥'
    case 'medium': return '⚡'
    case 'low': return '💡'
    default: return '📌'
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'high': return '🚨'
    case 'medium': return '⚠️'
    case 'low': return '💭'
    default: return '❗'
  }
}

// Helper function to create mind map data from CollectionDashboard props
export function createMindMapDataFromCollection(
  collectionData: {
    id: string
    title: string
    domain: string
    summary: string
  },
  conversations: Array<{
    id: string
    title: string
    domain: string
    messages?: unknown[]
  }>,
  documents: Document[],
  actionItems: ActionItem[]
): CollectionMindMapData {
  return {
    id: collectionData.id,
    title: collectionData.title,
    domain: collectionData.domain,
    summary: collectionData.summary,
    conversations: conversations.map(conv => ({
      ...conv,
      messages: conv.messages || []
    })),
    documents,
    actionItems
  }
}
