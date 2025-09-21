'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Grid, List, CheckCircle, Clock, AlertTriangle, Eye, MoreVertical, ExternalLink, ClipboardList, FileText, Settings, Calendar, MessageCircle, Brain, Music, BarChart3, FileIcon, FileSpreadsheet, ImageIcon, Loader2 } from 'lucide-react'
import { PDFViewer } from '@/components/ui/PDFViewer'
import { MindMapViewer } from '@/components/ui/MindMapViewer'
import { ActionItem, Document } from '@/types'
import { generateMindMapCode, createMindMapDataFromCollection, generateEnhancedMindMap, EnhancedMindMapData, InteractiveMindMapNode } from '@/lib/mindMapGenerator'
// TODO: Uncomment when API is ready
// import { collectionsApi, useApiCall } from '@/api'

interface CollectionDashboardProps {
  collectionId: string
  onBack: () => void
  // TODO: Remove onStartNewChat when API is ready - this is for viewing user history only
  onStartNewChat?: () => void
}

export function CollectionDashboard({ collectionId, onBack, onStartNewChat }: CollectionDashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'pending' | 'completed'>('all')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showMindMap, setShowMindMap] = useState(false)
  const [mindMapCode, setMindMapCode] = useState('')
  const [enhancedMindMapData, setEnhancedMindMapData] = useState<EnhancedMindMapData | null>(null)
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false)

  // TODO: Replace with API call when backend is ready
  // const { 
  //   data: dashboardData, 
  //   loading: dashboardLoading, 
  //   error: dashboardError 
  // } = useApiCall(() => collectionsApi.getCollectionDashboard(collectionId), [collectionId])

  // Mock data for development - TODO: Remove when API is ready
  const dashboardLoading = false
  const dashboardError = null
  const collectionData = {
    id: collectionId,
    title: 'Employment Contract Review',
    domain: 'employment',
    summary: 'Comprehensive review of employment contract terms, salary compliance analysis, and identification of potentially problematic clauses requiring immediate legal attention.',
    status: 'active' as const,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  }

  const documents: Document[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      originalFilename: 'Employment_Contract_2024.pdf',
      storedFilename: '550e8400-e29b-41d4-a716-446655440001.pdf',
      fileType: 'application/pdf',
      fileSize: 245760, // ~240KB
      s3Bucket: 'legalkaki-documents',
      s3Key: 'documents/user-1/550e8400-e29b-41d4-a716-446655440001.pdf',
      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      analysisStatus: 'completed',
      contentSummary: 'Standard employment contract outlining terms of employment, salary structure, working hours, and employee benefits. Contains standard clauses for annual leave, sick leave, and termination procedures.',
      collectionId: collectionId,
      metadata: {
        pages: 5,
        language: 'en',
        wordCount: 1250
      }
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      originalFilename: 'Business_Plan_Draft.docx',
      storedFilename: '550e8400-e29b-41d4-a716-446655440002.docx',
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 1048576, // 1MB
      s3Bucket: 'legalkaki-documents',
      s3Key: 'documents/user-1/550e8400-e29b-41d4-a716-446655440002.docx',
      uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      analysisStatus: 'processing',
      contentSummary: 'Comprehensive business plan draft covering market analysis, financial projections, operational strategies, and growth plans for a new startup venture in the technology sector.',
      collectionId: collectionId,
      metadata: {
        pages: 12,
        language: 'en',
        wordCount: 3500
      }
    }
  ]

  const actionItems: ActionItem[] = [
    {
      id: '1',
      title: 'Seek legal advice immediately',
      description: 'Contract contains potentially illegal clauses that need immediate attention',
      priority: 'urgent',
      status: 'pending',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      externalLinks: [
        { text: 'Find Legal Aid', url: 'https://www.legalaid.gov.my', icon: ExternalLink } // TODO: Replace with LegalKaki resource URL
      ],
      sourceConversation: 'Employment Contract Review'
    },
    {
      id: '2',
      title: 'Review salary compliance with minimum wage',
      description: 'Ensure your salary meets the current minimum wage requirements',
      priority: 'important',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      externalLinks: [
        { text: 'Check Minimum Wage Rates', url: 'https://www.mohr.gov.my', icon: ExternalLink } // TODO: Replace with LegalKaki resource URL
      ],
      sourceConversation: 'Employment Contract Review'
    },
    {
      id: '3',
      title: 'Submit SSM registration form',
      description: 'Complete business registration with Companies Commission of Malaysia',
      priority: 'normal',
      status: 'completed',
      externalLinks: [
        { text: 'SSM Portal', url: 'https://www.ssm.com.my', icon: ExternalLink } // TODO: Replace with LegalKaki resource URL
      ],
      sourceConversation: 'Business Registration Inquiry'
    }
  ]

  const conversations = [
    {
      id: '1',
      domain: 'employment' as const,
      title: 'Employment Contract Review',
      messages: [],
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 50 * 60 * 1000),
      collectionId: collectionId
    }
  ]

  const stats = {
    totalConversations: conversations.length,
    totalDocuments: documents.length,
    totalActions: actionItems.length,
    urgentActions: actionItems.filter(a => a.priority === 'urgent' && a.status !== 'completed').length,
    completedActions: actionItems.filter(a => a.status === 'completed').length
  }

  // Filter action items based on active filter
  const filteredActions = actionItems.filter(action => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'urgent') return action.priority === 'urgent'
    if (activeFilter === 'pending') return action.status === 'pending'
    if (activeFilter === 'completed') return action.status === 'completed'
    return true
  }).sort((a, b) => {
    // Sort by urgency: urgent > important > normal
    const priorityOrder = { urgent: 0, important: 1, normal: 2 }
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
  })


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200'
      case 'important': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'normal': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />
      default: return <AlertTriangle className="w-5 h-5 text-red-500" />
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return FileIcon
      case 'docx': 
      case 'doc': return FileText
      case 'xlsx':
      case 'xls': return FileSpreadsheet
      case 'jpg':
      case 'jpeg':
      case 'png': return ImageIcon
      default: return FileIcon
    }
  }

  const getAnalysisStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'processing': return 'text-yellow-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const handleGenerateMindMap = async () => {
    try {
      setIsGeneratingMindMap(true)
      console.log('🚀 Starting enhanced AI mind map generation...')
      console.log('📊 Collection data:', collectionData)
      console.log('💬 Conversations:', conversations.length)
      console.log('📄 Documents:', documents.length)
      console.log('✅ Action items:', actionItems.length)
      
      // Create mind map data from current collection data
      const mindMapData = createMindMapDataFromCollection(
        collectionData,
        conversations,
        documents,
        actionItems
      )
      
      console.log('🧩 Mind map data created:', mindMapData)
      
      // Generate enhanced mind map with AI insights
      const startTime = performance.now()
      const enhancedData = await generateEnhancedMindMap(mindMapData)
      const endTime = performance.now()
      
      console.log(`⚡ Enhanced mind map generation took ${(endTime - startTime).toFixed(2)}ms`)
      console.log('🧠 AI insights generated:', enhancedData.insights)
      console.log('📝 Generated code length:', enhancedData.mermaidCode.length)
      console.log('🔍 Generated code preview:', enhancedData.mermaidCode.substring(0, 300) + '...')
      
      setMindMapCode(enhancedData.mermaidCode)
      setEnhancedMindMapData(enhancedData)
      setShowMindMap(true)
      
      console.log('✨ Enhanced mind map modal should now open')
    } catch (error) {
      console.error('❌ Error generating enhanced mind map:', error)
      
      // Fallback to basic mind map
      try {
        console.log('🔄 Falling back to basic mind map...')
        const mindMapData = createMindMapDataFromCollection(
          collectionData,
          conversations,
          documents,
          actionItems
        )
        const basicCode = generateMindMapCode(mindMapData)
        setMindMapCode(basicCode)
        setShowMindMap(true)
        console.log('✅ Basic mind map fallback successful')
      } catch (fallbackError) {
        console.error('❌ Even basic mind map failed:', fallbackError)
      }
    } finally {
      setIsGeneratingMindMap(false)
    }
  }

  const handleNodeClick = (node: InteractiveMindMapNode) => {
    console.log('🖱️ Node clicked in CollectionDashboard:', node)
    
    switch (node.navigationTarget?.action) {
      case 'openDocument':
        const doc = node.navigationTarget.data as Document
        setSelectedDocument(doc)
        setShowMindMap(false) // Close mind map to show document
        break
        
      case 'startChat':
        if (onStartNewChat) {
          onStartNewChat()
          setShowMindMap(false)
        }
        break
        
      case 'showAction':
        // Could scroll to action items section or open action details
        console.log('📝 Action clicked:', node.navigationTarget.data)
        // For now, just close mind map and user can see actions below
        setShowMindMap(false)
        break
        
      case 'showInsight':
        // Insight details are already shown in the AI panel
        console.log('🧠 Insight clicked:', node.navigationTarget.data)
        break
        
      default:
        console.log('❓ Unknown navigation action:', node.navigationTarget?.action)
    }
  }

  // TODO: Uncomment when API is ready
  // Loading state
  // if (dashboardLoading) {
  //   return (
  //     <div className="min-h-screen bg-background p-4 pb-nav">
  //       <div className="max-w-6xl mx-auto">
  //         <div className="text-center py-12">
  //           <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-primary mb-4" />
  //           <p className="body-regular text-text-secondary">Loading collection dashboard...</p>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  // TODO: Uncomment when API is ready
  // Error state
  // if (dashboardError || !collectionData) {
  //   return (
  //     <div className="min-h-screen bg-background p-4 pb-nav">
  //       <div className="max-w-6xl mx-auto">
  //         <div className="flex items-center justify-between mb-4">
  //           <Button
  //             variant="ghost"
  //             size="small"
  //             onClick={onBack}
  //             leftIcon={<ArrowLeft className="w-4 h-4" />}
  //           >
  //             Back
  //           </Button>
  //         </div>
  //         <Card className="text-center py-12 border-red-200 bg-red-50">
  //           <CardContent>
  //             <div className="mb-4 flex justify-center">
  //               <AlertTriangle className="w-16 h-16 text-red-500" />
  //             </div>
  //             <h3 className="heading-3 mb-2 text-red-700">Error Loading Collection</h3>
  //             <p className="body-regular text-red-600 mb-4">
  //               {dashboardError || 'Collection not found'}
  //             </p>
  //             <Button 
  //               onClick={onBack} 
  //               variant="secondary"
  //               className="border-red-300 text-red-700 hover:bg-red-100"
  //             >
  //               Go Back
  //             </Button>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-background p-4 pb-nav">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="small"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 bg-purple-subtle text-purple-primary rounded-full text-sm font-medium">
                {collectionData.domain}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                collectionData.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                collectionData.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {collectionData.status}
              </span>
            </div>
            <h1 className="heading-2 mb-3">{collectionData.title}</h1>
            <p className="body-regular text-text-secondary mb-4 leading-relaxed">
              {collectionData.summary}
            </p>
            <div className="flex items-center space-x-4 text-text-secondary body-small">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Created {collectionData.createdAt.toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Updated {collectionData.updatedAt.toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{stats.totalConversations} messages</span>
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-purple-primary">{stats.totalDocuments}</div>
              <div className="body-small text-text-secondary">Documents</div>
            </motion.div>
            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-purple-primary">{stats.totalActions}</div>
              <div className="body-small text-text-secondary">Total Actions</div>
            </motion.div>

            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-purple-primary">{stats.totalConversations}</div>
              <div className="body-small text-text-secondary">Conversations</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Documents Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-purple-primary" />
              <h2 className="heading-3">Your Documents</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {documents.length > 0 && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setSelectedDocument(documents[0])}
                  leftIcon={<Eye className="w-4 h-4" />}
                  className="bg-gradient-to-r from-purple-primary to-purple-light"
                >
                  View Document
                </Button>
              )}
              
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setViewMode('grid')}
                leftIcon={<Grid className="w-4 h-4" />}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => setViewMode('list')}
                leftIcon={<List className="w-4 h-4" />}
              >
                List
              </Button>
            </div>
          </div>

          {documents.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="mb-4 flex justify-center">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="heading-3 mb-2">No documents in this collection</h3>
                <p className="body-regular text-text-secondary mb-4">
                  This collection does not contain any documents yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
              {documents.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="relative bg-white border-0 shadow-sm hover:shadow-2xl hover:shadow-purple-primary/20 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 rounded-xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-primary to-purple-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    <CardContent className="relative p-6 z-10">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1 transform group-hover:scale-110 transition-transform duration-300">
                          {(() => {
                            const IconComponent = getFileIcon(document.fileType)
                            return <IconComponent className="w-10 h-10 text-purple-primary group-hover:text-purple-light transition-colors duration-300" />
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="heading-4 text-text-primary mb-2 group-hover:text-purple-primary transition-colors duration-300">
                            {document.originalFilename}
                          </h4>
                          
                          <p className="body-regular text-text-secondary mb-4 leading-relaxed">
                            {document.contentSummary || "No summary available for this document."}
                          </p>
                          
                          
                          <div className="flex justify-end">
                            <Button 
                              variant="primary" 
                              size="default" 
                              leftIcon={<Eye className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />}
                              onClick={() => setSelectedDocument(document)}
                              className="bg-gradient-to-r from-purple-primary to-purple-light hover:from-purple-light hover:to-purple-primary shadow-lg hover:shadow-xl hover:shadow-purple-primary/30 transform hover:scale-105 transition-all duration-300 border-0"
                            >
                              View Document
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Action Items Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-6 h-6 text-purple-primary" />
              <h2 className="heading-3">Action Items</h2>
            </div>
            
            <div className="flex space-x-2">
              {['all', 'urgent', 'pending', 'completed'].map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => setActiveFilter(filter as 'all' | 'urgent' | 'pending' | 'completed')}
                  className="capitalize"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

          {filteredActions.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="mb-4 flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h3 className="heading-3 mb-2">No action items found</h3>
                <p className="body-regular text-text-secondary mb-4">
                  {activeFilter === 'all' 
                    ? 'No action items have been generated for this collection yet'
                    : `No ${activeFilter} action items at the moment`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getStatusIcon(action.status)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="body-regular font-medium text-text-primary mb-1">
                                {action.title}
                              </h4>
                              <p className="body-small text-text-secondary mb-2">
                                {action.description}
                              </p>
                            </div>
                            
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(action.priority)}`}>
                              {action.priority.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-end">
                            <div className="flex space-x-2">
                              {action.externalLinks?.map((link, linkIndex) => (
                                <Button
                                  key={linkIndex}
                                  variant="secondary"
                                  size="small"
                                  rightIcon={<ExternalLink className="w-3 h-3" />}
                                  onClick={() => {
                                    // TODO: Replace with actual LegalKaki resource URLs
                                    window.open(link.url, '_blank')
                                  }}
                                >
                                  {link.text}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Analysis Tools Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-6 h-6 text-purple-primary" />
            <h2 className="heading-3">Analysis Tools</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mind Map Generator */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-purple-primary to-purple-light text-white cursor-pointer">
                <CardContent className="p-6">
                  <div className="mb-3">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="heading-3 text-white mb-2">Generate Mind Map</h3>
                  <p className="body-regular text-purple-subtle mb-4">
                    Create a visual overview of all your conversations, documents, and action items
                  </p>
                  <Button 
                    variant="secondary" 
                    className="bg-white text-purple-primary hover:bg-purple-subtle"
                    onClick={handleGenerateMindMap}
                    disabled={isGeneratingMindMap}
                    leftIcon={isGeneratingMindMap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  >
                    {isGeneratingMindMap ? 'Generating AI Mind Map...' : 'Generate AI Mind Map'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Audio Transcripts */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-success to-green-600 text-white cursor-pointer">
                <CardContent className="p-6">
                  <div className="mb-3">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="heading-3 text-white mb-2">Audio Transcripts</h3>
                  <p className="body-regular text-green-100 mb-4">
                    Access transcripts from voice consultations and audio uploads
                  </p>
                  <Button variant="secondary" className="bg-white text-success hover:bg-green-50">
                    View Transcripts
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedDocument && (
        <PDFViewer
          documentId={selectedDocument.id}
          filename={selectedDocument.originalFilename}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Enhanced Mind Map Modal */}
      {showMindMap && (
        <MindMapViewer
          isOpen={showMindMap}
          onClose={() => setShowMindMap(false)}
          mermaidCode={mindMapCode}
          title={collectionData.title}
          enhancedData={enhancedMindMapData || undefined}
          onNodeClick={handleNodeClick}
        />
      )}
    </div>
  )
}
