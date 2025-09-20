'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, Grid, List, CheckCircle, Clock, AlertTriangle, Upload, Eye, MoreVertical, ExternalLink, ClipboardList, FileText, Settings, Calendar, MessageCircle, Brain, Music, BarChart3, FileIcon, FileSpreadsheet, ImageIcon } from 'lucide-react'
import { PDFViewer } from '@/components/ui/PDFViewer'
import { ActionItem, Document } from '@/types'

interface CollectionDashboardProps {
  collectionId: string
  onBack: () => void
  onStartNewChat: () => void
}

export function CollectionDashboard({ collectionId, onBack, onStartNewChat }: CollectionDashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'pending' | 'completed'>('all')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  // Mock collection data - in real app this would come from API based on collectionId
  const collectionData = {
    id: collectionId,
    title: 'Employment Contract Review',
    domain: 'Employment Law',
    summary: 'Comprehensive review of employment contract terms, salary compliance analysis, and identification of potentially problematic clauses requiring immediate legal attention.',
    created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    messageCount: 12,
    status: 'active' as const
  }

  // Mock data - in real app this would come from API/state management
  const stats = {
    activeActions: 3,
    documents: 2,
    conversations: collectionData.messageCount
  }

  const mockActions: ActionItem[] = [
    {
      id: '1',
      title: 'Seek legal advice immediately',
      description: 'Contract contains potentially illegal clauses that need immediate attention',
      priority: 'urgent',
      status: 'pending',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      externalLinks: [
        { text: 'Find Legal Aid', url: 'https://www.legalaid.gov.my', icon: ExternalLink }
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
        { text: 'Check Minimum Wage Rates', url: 'https://www.mohr.gov.my', icon: ExternalLink }
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
        { text: 'SSM Portal', url: 'https://www.ssm.com.my', icon: ExternalLink }
      ],
      sourceConversation: 'Business Registration Inquiry'
    }
  ]

  const mockDocuments: Document[] = [
    {
      id: '1',
      filename: 'Employment_Contract_2024.pdf',
      fileType: 'pdf',
      fileSize: 245760, // ~240KB
      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      analysisStatus: 'completed',
      thumbnail: undefined
    },
    {
      id: '2',
      filename: 'Business_Plan_Draft.docx',
      fileType: 'docx',
      fileSize: 1048576, // 1MB
      uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      analysisStatus: 'processing',
      thumbnail: undefined
    }
  ]

  const filteredActions = mockActions.filter(action => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'urgent') return action.priority === 'urgent'
    if (activeFilter === 'pending') return action.status === 'pending'
    if (activeFilter === 'completed') return action.status === 'completed'
    return true
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
                <span>Created {collectionData.created.toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Updated {collectionData.lastUpdated.toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{collectionData.messageCount} messages</span>
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
              <div className="text-2xl font-bold text-purple-primary">{stats.activeActions}</div>
              <div className="body-small text-text-secondary">Active Actions</div>
            </motion.div>
            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-success">{stats.documents}</div>
              <div className="body-small text-text-secondary">Documents</div>
            </motion.div>
            <motion.div 
              className="text-center p-4 bg-surface-white rounded-lg border border-gray-200"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl font-bold text-info">{stats.conversations}</div>
              <div className="body-small text-text-secondary">Conversations</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Action Items Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
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
                    ? 'Start a conversation to get personalized legal action items'
                    : `No ${activeFilter} action items at the moment`
                  }
                </p>
                <Button onClick={onStartNewChat}>
                  Start New Chat
                </Button>
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
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-text-secondary body-small">
                              {action.dueDate && (
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDate(action.dueDate)}</span>
                                </span>
                              )}
                              <span className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{action.sourceConversation}</span>
                              </span>
                            </div>
                            
                            <div className="flex space-x-2">
                              {action.externalLinks?.map((link, linkIndex) => (
                                <Button
                                  key={linkIndex}
                                  variant="secondary"
                                  size="small"
                                  rightIcon={<ExternalLink className="w-3 h-3" />}
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

        {/* Documents Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-purple-primary" />
              <h2 className="heading-3">Your Documents</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {mockDocuments.length > 0 && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setSelectedDocument(mockDocuments[0])}
                  leftIcon={<Eye className="w-4 h-4" />}
                  className="bg-gradient-to-r from-purple-primary to-purple-light"
                >
                  Demo PDF Explainer
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

          {mockDocuments.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="mb-4 flex justify-center">
                  <Upload className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="heading-3 mb-2">No documents uploaded yet</h3>
                <p className="body-regular text-text-secondary mb-4">
                  Upload legal documents to get AI-powered analysis and explanations
                </p>
                <Button leftIcon={<Upload className="w-4 h-4" />}>
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {mockDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="card-interactive">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {(() => {
                            const IconComponent = getFileIcon(document.fileType)
                            return <IconComponent className="w-8 h-8 text-purple-primary" />
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="body-regular font-medium text-text-primary mb-1 truncate">
                            {document.filename}
                          </h4>
                          
                          <div className="flex items-center space-x-3 text-text-secondary body-small mb-2">
                            <span>{formatFileSize(document.fileSize)}</span>
                            <span>{formatDate(document.uploadDate)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center space-x-1 ${getAnalysisStatusColor(document.analysisStatus)}`}>
                              {document.analysisStatus === 'completed' && <CheckCircle className="w-4 h-4" />}
                              {document.analysisStatus === 'processing' && <Clock className="w-4 h-4" />}
                              {document.analysisStatus === 'error' && <AlertTriangle className="w-4 h-4" />}
                              <span className="body-small capitalize">{document.analysisStatus}</span>
                            </div>
                            
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="small" 
                                leftIcon={<Eye className="w-3 h-3" />}
                                onClick={() => setSelectedDocument(document)}
                              >
                                View
                              </Button>
                              <Button variant="ghost" size="small" leftIcon={<MoreVertical className="w-3 h-3" />}>
                                More
                              </Button>
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
                  <Button variant="secondary" className="bg-white text-purple-primary hover:bg-purple-subtle">
                    Generate Mind Map
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

            {/* Summary Report */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-info to-blue-600 text-white cursor-pointer">
                <CardContent className="p-6">
                  <div className="mb-3">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="heading-3 text-white mb-2">Legal Summary Report</h3>
                  <p className="body-regular text-blue-100 mb-4">
                    Generate a comprehensive report of your legal matters and recommendations
                  </p>
                  <Button variant="secondary" className="bg-white text-info hover:bg-blue-50">
                    Generate Report
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
          filename={selectedDocument.filename}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}
