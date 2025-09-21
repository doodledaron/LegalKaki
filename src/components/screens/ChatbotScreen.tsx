'use client'

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { ArrowLeft, Send, Paperclip, Bookmark, FileText, Lightbulb, Search, ClipboardList, AlertTriangle, CheckCircle, ExternalLink, PanelLeftOpen, PanelLeftClose, X, Download, Eye, ChevronDown, Edit } from 'lucide-react'
import { LegalDomain, Message, FileAttachment, Document } from '@/types'
import { LEGAL_DOMAINS } from '@/constants/domains'
import { documentsApi, chatApi, useApiCall, useApiMutation } from '@/api'

interface ChatbotScreenProps {
  domain: LegalDomain
  onBack: () => void
}

// Mock draft response data - moved outside component
const mockDraftResponse = {
  documentDraft: `**EMPLOYMENT CONTRACT DRAFT**

**PARTIES:**
- Employer: [Company Name]
- Employee: [Employee Name]

**POSITION & DUTIES:**
The Employee is hereby engaged as [Job Title] and shall perform duties including but not limited to:
• [Primary responsibility 1]
• [Primary responsibility 2] 
• [Primary responsibility 3]

**COMPENSATION:**
- Monthly Salary: RM [Amount]
- Benefits: Medical insurance, annual leave (14 days), sick leave (14 days)
- EPF & SOCSO contributions as per Malaysian law

**WORKING HOURS:**
- Standard: 9:00 AM to 6:00 PM, Monday to Friday
- Total: 40 hours per week (compliant with Employment Act 1955)

**TERMINATION:**
- Notice Period: 1 month written notice by either party
- Probation: 3 months from commencement date

⚠️ **DISCLAIMER**: This is an AI-generated draft. Please have it reviewed by a qualified lawyer before use.`,
  
  editingSuggestions: [
    {
      section: "Compensation Clause",
      suggestion: "Consider adding performance bonus structure",
      priority: "medium"
    },
    {
      section: "Termination Clause", 
      suggestion: "Specify grounds for immediate termination",
      priority: "high"
    },
    {
      section: "Working Hours",
      suggestion: "Add overtime compensation details",
      priority: "medium"
    }
  ]
}

// Mock analysis data - moved outside component  
const mockAnalysis = {
  explanation: "Based on your question about employment contracts, here's what you need to know: Employment contracts in Malaysia are governed by the Employment Act 1955. Your contract should clearly outline salary, working hours, benefits, and termination procedures.",
  risks: [
    { level: 'high' as const, description: 'Missing mandatory termination clauses', icon: AlertTriangle },
    { level: 'medium' as const, description: 'Contract terms may not comply with Employment Act', icon: AlertTriangle },
    { level: 'low' as const, description: 'Standard termination clauses present', icon: CheckCircle }
  ],
  keyPoints: [
    'Minimum wage requirements must be met',
    'Working hours should not exceed 48 hours per week',
    'Annual leave entitlement must be specified',
    'Termination notice period should be clearly stated'
  ],
  actions: [
    {
      id: '1',
      title: 'Seek legal advice immediately',
      description: 'Contract contains potentially illegal clauses that need immediate attention',
      priority: 'urgent' as const,
      status: 'pending' as const,
      externalLinks: [
        { text: 'Find Legal Aid', url: 'https://www.legalaid.gov.my', icon: ExternalLink }
      ]
    },
    {
      id: '2',
      title: 'Review salary compliance with minimum wage',
      description: 'Ensure your salary meets the current minimum wage requirements',
      priority: 'important' as const,
      status: 'pending' as const,
      externalLinks: [
        { text: 'Check Minimum Wage Rates', url: 'https://www.mohr.gov.my', icon: ExternalLink }
      ]
    },
    {
      id: '3',
      title: 'Verify working hours arrangement',
      description: 'Confirm that working hours comply with Employment Act limits',
      priority: 'normal' as const,
      status: 'pending' as const
    }
  ]
}

// Memoized Draft Message Bubble Component
const DraftMessageBubble = memo(({ draftResult }: { draftResult: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-start mb-4"
  >
    <div className="max-w-[90%] bg-gradient-to-br from-purple-subtle/50 to-white border-2 border-purple-primary/30 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
      <div className="p-4 border-b border-purple-primary/10 bg-purple-subtle/20">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="w-5 h-5 text-purple-primary" />
          <p className="body-regular font-medium text-purple-primary">
            Document Draft Ready
          </p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
          <pre className="whitespace-pre-wrap text-sm text-text-primary font-mono leading-relaxed">
            {draftResult.content}
          </pre>
        </div>
        
        <div className="space-y-3">
          <h4 className="body-regular font-medium text-text-primary flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-purple-primary" />
            <span>Editing Suggestions</span>
          </h4>
          
          {(draftResult.suggestions || []).map((suggestion: any, index: number) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-purple-subtle/20 rounded-lg border border-purple-primary/10">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                suggestion.priority === 'high' ? 'bg-red-500' : 
                suggestion.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              <div className="flex-1">
                <p className="body-small font-medium text-text-primary mb-1">
                  {suggestion.section}
                </p>
                <p className="caption text-text-secondary">
                  {suggestion.suggestion}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {suggestion.priority.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" size="small" leftIcon={<FileText className="w-3 h-3" />}>
            Download Draft
          </Button>
          <Button variant="secondary" size="small" leftIcon={<Send className="w-3 h-3" />}>
            Request Revisions
          </Button>
          <Button variant="ghost" size="small" leftIcon={<Bookmark className="w-3 h-3" />}>
            Save to Collection
          </Button>
        </div>
      </div>
      
      <div className="p-3 bg-gray-50/50 border-t border-gray-100">
        <p className="caption text-text-secondary text-center">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  </motion.div>
))

DraftMessageBubble.displayName = 'DraftMessageBubble'

// Memoized Analysis Message Bubble Component  
const AnalysisMessageBubble = memo(({ analysisResult }: { analysisResult: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-start mb-4"
  >
    <div className="max-w-[90%] bg-surface-white border-2 border-indigo-200/50 rounded-2xl rounded-bl-sm shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <p className="body-regular text-text-primary mb-2">
          Here&apos;s my detailed analysis:
        </p>
      </div>
      
      <Tabs defaultValue="explanation" className="w-full">
        <TabsList className="w-full justify-start border-b border-gray-100 bg-gray-50/50 rounded-none px-4">
          <TabsTrigger value="explanation" className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Explanation</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center space-x-2">
            <ClipboardList className="w-4 h-4" />
            <span>Actions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explanation" className="p-4 space-y-4">
          <div className="bg-purple-subtle/30 rounded-lg p-4 border border-purple-primary/20">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-4 h-4 text-purple-primary" />
              <span className="body-small font-medium text-purple-primary">Legal Explanation</span>
            </div>
            <p className="body-regular text-text-primary">{analysisResult.explanation}</p>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="p-4 space-y-4">
          <div>
            <h4 className="body-regular font-medium mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-purple-primary" />
              <span>Risk Assessment</span>
            </h4>
            <div className="space-y-2">
              {analysisResult.risks.map((risk: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                    risk.level === 'high' ? 'text-red-500' : 
                    risk.level === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                      risk.level === 'high' ? 'bg-red-100 text-red-700' :
                      risk.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {risk.level.toUpperCase()}
                    </span>
                    <p className="body-small text-text-primary">{risk.description}</p>
                    {risk.recommendation && (
                      <p className="caption text-text-secondary mt-1">{risk.recommendation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="body-regular font-medium mb-3 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-purple-primary" />
              <span>Key Points</span>
            </h4>
            <div className="space-y-2">
              {analysisResult.keyPoints.map((point: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-2">
                  <span className="text-purple-primary mt-1 text-sm">•</span>
                  <span className="body-small text-text-primary">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="p-4 space-y-3">
          {analysisResult.actionItems.map((action: any) => (
            <div key={action.id} className="border border-purple-primary/20 bg-purple-subtle/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input 
                  type="checkbox" 
                  className="mt-1 rounded border-gray-300 text-purple-primary focus:ring-purple-primary" 
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h5 className="body-regular font-medium text-text-primary">{action.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      action.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      action.priority === 'important' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {action.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="body-small text-text-secondary mb-3">{action.description}</p>
                  {action.externalLinks && (
                    <div className="flex flex-wrap gap-2">
                      {action.externalLinks.map((link: any, index: number) => (
                        <Button 
                          key={index} 
                          variant="secondary" 
                          size="small"
                          leftIcon={<ExternalLink className="w-3 h-3" />}
                          className="text-xs"
                        >
                          {link.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
      
      <div className="p-3 bg-gray-50/50 border-t border-gray-100">
        <p className="caption text-text-secondary text-center">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  </motion.div>
))

AnalysisMessageBubble.displayName = 'AnalysisMessageBubble'

// Memoized Regular Message Bubble Component
const RegularMessageBubble = memo(({ message }: { message: Message }) => (
  <motion.div
    key={message.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    <div
      className={`max-w-[85%] px-4 py-3 rounded-2xl ${
        message.sender === 'user'
          ? 'bg-purple-primary text-white rounded-br-sm'
          : 'bg-surface-white border border-gray-200 text-text-primary rounded-bl-sm'
      }`}
    >
      <p className={`body-regular ${message.sender === 'user' ? 'text-white' : 'text-text-primary'}`}>
        {message.content}
      </p>
      <p className={`caption mt-1 ${
        message.sender === 'user' ? 'text-white/80' : 'text-text-secondary'
      }`}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </motion.div>
))

RegularMessageBubble.displayName = 'RegularMessageBubble'

export function ChatbotScreen({ domain, onBack }: ChatbotScreenProps) {
  const [showDocumentPrompt, setShowDocumentPrompt] = useState(true)
  const [currentSession, setCurrentSession] = useState<any>(null) // Will use proper type from API
  const [inputValue, setInputValue] = useState('')
  const [isDraftMode, setIsDraftMode] = useState(false)
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] = useState<Document | null>(null)
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [draftData, setDraftData] = useState<any>(null)

  // API hooks
  // #TODO: Replace documentsApi.getDocuments() with real backend endpoint
  // GET /api/documents - Fetch user's uploaded documents
  const { data: availableDocuments, loading: documentsLoading } = useApiCall(
    () => documentsApi.getDocuments(),
    []
  )
  
  // #TODO: Replace chatApi.createSession with real backend endpoint  
  // POST /api/chat/sessions - Create new chat session
  const { mutate: createSession, loading: creatingSession } = useApiMutation(chatApi.createSession)
  
  // Custom sendMessage function since the API takes multiple parameters
  const [sendingMessage, setSendingMessage] = useState(false)
  const sendMessage = async (sessionId: string, request: any) => {
    setSendingMessage(true)
    try {
      // #TODO: Replace chatApi.sendMessage with real backend endpoint
      // POST /api/chat/sessions/{sessionId}/messages - Send message and get AI response
      const response = await chatApi.sendMessage(sessionId, request)
      return response
    } finally {
      setSendingMessage(false)
    }
  }

  // Convert API documents to FileAttachment format for display consistency
  const uploadedFiles: FileAttachment[] = useMemo(() => {
    if (!availableDocuments) return []
    
    return availableDocuments.map(doc => ({
      id: doc.id,
      filename: doc.originalFilename,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      url: `#document-${doc.id}` // Placeholder URL
    }))
  }, [availableDocuments])
  // Remove separate state variables - we'll use message types instead
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const dropdown = document.querySelector('.document-dropdown')
      const button = document.querySelector('.document-dropdown-button')
      
      if (showDocumentDropdown && dropdown && button && 
          !dropdown.contains(target) && !button.contains(target)) {
        setShowDocumentDropdown(false)
      }
    }

    if (showDocumentDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDocumentDropdown])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSession) return

    const messageType = isDraftMode ? 'draft_request' : 'analysis_request'
    const messageContent = inputValue.trim()
    setInputValue('')

    // Create user message immediately
    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      domain
    }

    // Add user message to session immediately
    const newMessages = [...currentSession.messages, userMessage]
    setCurrentSession({
      ...currentSession,
      messages: newMessages
    })

    try {
      const response = await sendMessage(
        currentSession.id,
        {
          content: messageContent,
          messageType: messageType,
          attachments: selectedDocumentForEdit ? [selectedDocumentForEdit.id] : undefined
        }
      )

      if (response && response.success) {
        const responseData = response.data as any
        
        // Add AI response if provided
        if (responseData.aiResponse) {
          const updatedMessages = [...newMessages, responseData.aiResponse]
          setCurrentSession({
            ...currentSession,
            messages: updatedMessages
          })
        }

        // Store analysis/draft data separately for special message bubbles
        if (responseData.analysisResult) {
          setAnalysisData(responseData.analysisResult)
        }
        if (responseData.draftResult) {
          setDraftData(responseData.draftResult)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Could add error handling UI here
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length === 0) {
      alert('Please upload only PDF files.')
      return
    }

    // Add files to uploaded files list
    const newFiles: FileAttachment[] = pdfFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: URL.createObjectURL(file)
    }))
    
    // #TODO: Implement file upload with documentsApi.upload() 
    // POST /api/documents/upload - Upload PDF files with progress tracking
    // Should call API to upload files and refresh availableDocuments
    // setUploadedFiles(prev => [...prev, ...newFiles])

    // If this is the first upload (document prompt is showing), start the chat
    if (showDocumentPrompt) {
      handleUploadFirst()
      return
    }

    // Handle uploads during chat - trigger AI analysis
    if (currentSession) {
      const file = pdfFiles[0]
      const messageType = isDraftMode ? 'draft_request' : 'analysis_request'
      
      try {
        const response = await sendMessage(
          currentSession.id,
          {
            content: `I've uploaded "${file.name}" for ${isDraftMode ? 'editing' : 'analysis'}. Please help me with this document.`,
            messageType: messageType
          }
        )

        if (response && response.success) {
          const responseData = response.data as any
          // Update session with new messages
          const newMessages = [...currentSession.messages, responseData.message]
          
          if (responseData.aiResponse) {
            newMessages.push(responseData.aiResponse)
          }

          // Store analysis/draft data
          if (responseData.analysisResult) {
            setAnalysisData(responseData.analysisResult)
          }
          if (responseData.draftResult) {
            setDraftData(responseData.draftResult)
          }

          setCurrentSession({
            ...currentSession,
            messages: newMessages
          })
        }
      } catch (error) {
        console.error('Failed to analyze uploaded file:', error)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSaveToCollection = () => {
    // #TODO: Implement save to collection with collectionsApi.createCollection()
    // POST /api/collections - Save current chat session to a collection
    console.log('Save to collection clicked')
  }

  const handleStartChat = async () => {
    try {
      const response = await createSession({ domain })
      
      if (response) {
        setCurrentSession(response)
        setShowDocumentPrompt(false)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleSkipUpload = () => {
    handleStartChat()
  }

  const handleUploadFirst = async () => {
    try {
      const response = await createSession({ 
        domain,
        initialMessage: "I have documents to upload for analysis"
      })
      
      if (response) {
        setCurrentSession(response)
        setShowDocumentPrompt(false)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Document Upload Prompt Component - using useCallback to prevent re-creation
  const DocumentUploadPrompt = useCallback(() => (
    <div 
      className={`h-full flex items-center justify-center p-6 transition-all duration-300 ${
        isDragOver ? 'bg-purple-subtle/30' : 'bg-background'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <motion.div
        className="max-w-lg mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Drag & Drop Zone */}
        <motion.div
          className={`relative border-2 border-dashed rounded-2xl p-12 mb-6 transition-all duration-300 ${
            isDragOver 
              ? 'border-purple-primary bg-purple-subtle/20 scale-105' 
              : 'border-gray-300 hover:border-purple-primary/50 hover:bg-purple-subtle/10'
          }`}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Upload Icon */}
          <motion.div
            className="w-16 h-16 mx-auto mb-4 bg-purple-subtle rounded-xl flex items-center justify-center"
            animate={isDragOver ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FileText className={`w-8 h-8 transition-colors duration-300 ${
              isDragOver ? 'text-purple-primary' : 'text-purple-primary'
            }`} />
          </motion.div>

          {/* Main Text */}
          <motion.h2
            className="heading-3 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {isDragOver ? 'Drop your documents here' : 'Drag & drop your legal documents'}
          </motion.h2>

          <motion.p
            className="body-regular text-text-secondary mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Upload contracts, agreements, or any legal documents for more accurate AI assistance
          </motion.p>

          {/* File Input Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="text-purple-primary border-purple-primary/30 hover:bg-purple-subtle/20"
            >
              Or browse files
            </Button>
          </motion.div>

          {/* Drag overlay */}
          {isDragOver && (
            <motion.div
              className="absolute inset-0 bg-purple-primary/5 rounded-2xl flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-purple-primary font-medium">
                Release to upload
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Benefits */}
        <motion.div
          className="bg-purple-subtle/30 rounded-lg p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center space-x-2 text-purple-primary">
            <Lightbulb className="w-4 h-4" />
            <span className="body-small font-medium">
              AI provides better advice when it understands your specific documents
            </span>
          </div>
        </motion.div>

        {/* Skip Option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <button
            onClick={handleSkipUpload}
            className="text-text-secondary hover:text-purple-primary transition-colors duration-200 body-small underline underline-offset-4"
          >
            Skip and start chatting instead
          </button>
        </motion.div>
      </motion.div>
    </div>
  ), [isDragOver, handleDragOver, handleDragLeave, handleDrop, handleSkipUpload])

  // Side Panel Component - using useCallback to prevent re-creation
  const SidePanel = useCallback(() => (
    <AnimatePresence>
      {isSidePanelOpen && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute left-0 top-0 bottom-0 w-[30%] min-w-[280px] bg-surface-white border-r border-gray-200 shadow-xl z-30 flex flex-col"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-primary" />
              <h3 className="body-regular font-medium text-text-primary">Uploaded Files</h3>
            </div>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setIsSidePanelOpen(false)}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="body-small text-text-secondary">No files uploaded yet</p>
                <p className="caption text-text-secondary mt-1">Upload PDF files to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-primary/30 hover:bg-purple-subtle/10 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <FileText className="w-8 h-8 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="body-small font-medium text-text-primary truncate group-hover:text-purple-primary transition-colors">
                          {file.filename}
                        </h4>
                        <p className="caption text-text-secondary mt-1">
                          {formatFileSize(file.fileSize)}
                        </p>
                        <p className="caption text-text-secondary">
                          {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="small"
                        leftIcon={<Eye className="w-3 h-3" />}
                        className="text-xs"
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        leftIcon={<Download className="w-3 h-3" />}
                        className="text-xs"
                      >
                        Download
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/30">
            <p className="caption text-text-secondary text-center">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [isSidePanelOpen, uploadedFiles, formatFileSize])



  return (
    <div 
      className={`h-screen flex flex-col relative transition-colors duration-700 ${
        isDragOver ? 'bg-purple-subtle/20' : 
        isDraftMode ? 'bg-gradient-to-br from-purple-subtle/20 via-purple-light/10 to-background' : 
        'bg-gradient-to-br from-blue-50/30 via-gray-50/20 to-background'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Mode-specific background overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
        isDraftMode 
          ? 'opacity-100 bg-gradient-to-br from-purple-primary/8 via-purple-light/4 to-purple-subtle/6' 
          : 'opacity-100 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-gray-50/30'
      }`} />
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex bg-transparent">
        {/* Chat Area */}
        <motion.div 
          className="flex-1 flex flex-col"
          animate={{ 
            marginLeft: isSidePanelOpen ? '30%' : '0%' 
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-purple-primary/10 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-white rounded-2xl p-8 shadow-xl border-2 border-dashed border-purple-primary"
          >
            <div className="text-center">
              <Paperclip className="w-12 h-12 text-purple-primary mx-auto mb-4" />
              <h3 className="heading-3 text-purple-primary mb-2">Drop PDF File Here</h3>
              <p className="body-small text-text-secondary">Release to upload and analyze your document</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="bg-surface-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="small"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            
            <div className="bg-purple-subtle text-purple-primary px-3 py-1 rounded-full">
              <span className="body-small font-medium">
                {LEGAL_DOMAINS[domain]?.title || 'General'}
              </span>
            </div>
          </div>

          {/* Document Edit Mode Dropdown */}
          <div className="relative">
            <Button
              variant={selectedDocumentForEdit ? 'primary' : 'secondary'}
              size="small"
              leftIcon={selectedDocumentForEdit ? <Edit className="w-3 h-3" /> : <Search className="w-3 h-3" />}
              rightIcon={<ChevronDown className="w-3 h-3" />}
              onClick={() => setShowDocumentDropdown(!showDocumentDropdown)}
              className={`document-dropdown-button transition-all duration-300 ${
                selectedDocumentForEdit 
                  ? 'shadow-lg shadow-purple-primary/20 ring-2 ring-purple-primary/20' 
                  : 'hover:shadow-md'
              }`}
            >
              {selectedDocumentForEdit ? `Editing: ${selectedDocumentForEdit.originalFilename}` : 'Analysis Mode'}
            </Button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showDocumentDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="document-dropdown absolute top-full left-0 mt-2 w-80 bg-surface-white border border-gray-200 rounded-lg shadow-xl z-50"
                >
                  <div className="p-2">
                    {/* Analysis Mode Option */}
                    <button
                      onClick={() => {
                        setSelectedDocumentForEdit(null)
                        setIsDraftMode(false)
                        setShowDocumentDropdown(false)
                        
                        if (currentSession) {
                          const modeMessage: Message = {
                            id: Date.now().toString(),
                            content: "🔄 Switched to Analysis Mode - I'm ready to provide legal analysis and guidance!",
                            sender: 'assistant',
                            timestamp: new Date(),
                            domain
                          }
                          setCurrentSession({
                            ...currentSession,
                            messages: [...currentSession.messages, modeMessage]
                          })
                        }
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                        !selectedDocumentForEdit ? 'bg-purple-subtle text-purple-primary' : 'text-text-primary'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">Analysis Mode</div>
                        <div className="text-sm opacity-70">Get legal advice and document analysis</div>
                      </div>
                    </button>

                    {/* Documents List */}
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <div className="px-3 py-2">
                        <div className="text-sm font-medium text-text-secondary">Draft Agent:</div>
                      </div>
                      
                      {documentsLoading ? (
                        <div className="px-3 py-4 text-center text-text-secondary">
                          <div className="animate-spin w-4 h-4 border-2 border-purple-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          Loading documents...
                        </div>
                      ) : availableDocuments && availableDocuments.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          {availableDocuments.map((document) => (
                            <button
                              key={document.id}
                              onClick={() => {
                                setSelectedDocumentForEdit(document)
                                setIsDraftMode(true)
                                setShowDocumentDropdown(false)
                                
                                if (currentSession) {
                                  const modeMessage: Message = {
                                    id: Date.now().toString(),
                                    content: `🔄 Switched to Edit Mode for "${document.originalFilename}" - I'm ready to help you edit this document!`,
                                    sender: 'assistant',
                                    timestamp: new Date(),
                                    domain
                                  }
                                  setCurrentSession({
                                    ...currentSession,
                                    messages: [...currentSession.messages, modeMessage]
                                  })
                                }
                              }}
                              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                                selectedDocumentForEdit?.id === document.id ? 'bg-purple-subtle text-purple-primary' : 'text-text-primary'
                              }`}
                            >
                              <FileText className="w-4 h-4" />
                              <div className="text-left flex-1 min-w-0">
                                <div className="font-medium truncate">{document.originalFilename}</div>
                                <div className="text-sm opacity-70">
                                  {Math.round(document.fileSize / 1024)}KB • {document.analysisStatus}
                                </div>
                              </div>
                              {selectedDocumentForEdit?.id === document.id && (
                                <div className="w-2 h-2 bg-purple-primary rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-4 text-center text-text-secondary">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <div className="text-sm">No documents available</div>
                          <div className="text-xs opacity-70">Upload documents to edit them</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="small"
            leftIcon={isSidePanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="transition-all duration-200"
          >
            {isSidePanelOpen ? 'Hide Files' : 'Show Files'}
          </Button>
        </div>
      </div>

      {/* Draft Mode Banner */}
      <AnimatePresence>
        {isDraftMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-purple-primary to-purple-light text-white px-4 py-2 text-center shadow-lg border-b border-purple-primary/20"
          >
            <span className="body-small font-medium flex items-center justify-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Draft Mode Active - Focus on document drafting and editing</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container or Document Upload Prompt */}
      {showDocumentPrompt ? (
        <DocumentUploadPrompt />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
          <AnimatePresence>
            {currentSession?.messages.map((message: Message) => {
              // Handle special message types
              if (message.type === 'analysis' && analysisData) {
                return <AnalysisMessageBubble key={message.id} analysisResult={analysisData} />
              }
              if (message.type === 'draft' && draftData) {
                return <DraftMessageBubble key={message.id} draftResult={draftData} />
              }
              
              // Handle regular text messages
              return <RegularMessageBubble key={message.id} message={message} />
            })}
          </AnimatePresence>

          {(sendingMessage || creatingSession) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-surface-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%]">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-text-secondary rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-text-secondary rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-text-secondary rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Section - Only show when session exists */}
      {currentSession && (
        <div className="bg-surface-white border-t border-gray-200 p-4 pb-nav">
        <div className="flex items-center space-x-2 mb-3">
          <Button
            variant="ghost"
            size="small"
            onClick={handleSaveToCollection}
            leftIcon={<Bookmark className="w-4 h-4" />}
          >
            Save to Collection
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="small"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Paperclip className="w-4 h-4" />}
          >
            Upload PDF
          </Button>
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isDraftMode ? "Describe the legal document you need or ask for editing help..." : "Ask your legal question or drag & drop a PDF..."}
            className="pr-12 min-h-[44px] max-h-[120px] resize-none bg-gray-50 focus:bg-surface-white border-purple-primary/20 focus:border-purple-primary"
            rows={1}
          />
          
            <Button
              size="small"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || sendingMessage}
              className="absolute right-2 bottom-2 rounded-full w-8 h-8 p-0"
            >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="caption text-text-secondary mt-2 text-center">
          {isDraftMode 
            ? "📝 Draft Mode: Create new documents or edit existing ones with AI assistance"
            : "💡 Drag & drop PDF files anywhere or ask questions for instant legal analysis"
          }
        </p>
        </div>
      )}
        </motion.div>

        {/* Side Panel */}
        <SidePanel />
      </div>
    </div>
  )
}
