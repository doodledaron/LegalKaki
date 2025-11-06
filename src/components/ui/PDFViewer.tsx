'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, ZoomIn, ZoomOut, Download, X, Lightbulb, AlertCircle, Loader2 } from 'lucide-react'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { geminiService } from '@/api/geminiService'
import { api } from '@/api'
import { Document as DocumentType } from '@/types'
import { collectionApiClient } from '@/api/realApi'
import { getUserId } from '@/lib/auth-utils'
import { getEnvConfig } from '@/lib/envConfig'

// Configure PDF.js worker for react-pdf v9
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// Import necessary CSS for text layer and annotations
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface Tooltip {
  content: string
  x: number
  y: number
  visible: boolean
  category?: string
  selectedText?: string
  confidence?: number
}

interface PDFViewerProps {
  document: DocumentType
  onClose?: () => void
  collectionId?: string // Optional collection ID for fetching document details
}

export function PDFViewer({ document, onClose, collectionId }: PDFViewerProps) {
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [zoom, setZoom] = useState(1.0)
  const [tooltip, setTooltip] = useState<Tooltip>({ 
    content: '', 
    x: 0, 
    y: 0, 
    visible: false, 
    category: '',
    confidence: 0
  })
  const [highlightedTerms, setHighlightedTerms] = useState<Set<string>>(new Set())
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const viewerRef = useRef<HTMLDivElement>(null)

  // Initialize PDF URL
  useEffect(() => {
    const loadPdfUrl = async () => {
      try {
        setPdfLoading(true)
        const userId = getUserId()
        console.log('📄 Loading PDF for document:', {
          id: document.id,
          filename: document.originalFilename,
          s3Bucket: document.s3Bucket,
          s3Key: document.s3Key,
          fileType: document.fileType,
          userId: userId
        })

        // Get document details from collection endpoint
        try {
          console.log('🔄 Getting document details from collection endpoint...')

          // Use collectionId prop or document.collectionId, with fallback
          const collectionIdToUse = collectionId || document.collectionId || '7' // Fallback to '7' as seen in logs

          console.log(`📋 Fetching collection ${collectionIdToUse} details for document ${document.id}`)
          const collectionDetails = await collectionApiClient.getCollectionDetails(parseInt(collectionIdToUse))

          // Find the specific document in the collection
          console.log(`🔍 Searching for document ${document.id} in collection documents:`, collectionDetails.documents.map(d => ({ id: d.document_id, title: d.title })))

          const collectionDocument = collectionDetails.documents.find(doc =>
            doc.document_id.toString() === document.id
          )

          if (collectionDocument && collectionDocument.s3_bucket && collectionDocument.s3_key) {
            console.log('✅ Found document in collection details')
            console.log('📄 Document S3 info:', {
              bucket: collectionDocument.s3_bucket,
              key: collectionDocument.s3_key,
              region: 'ap-southeast-5'
            })

            // Use backend proxy endpoint to avoid CORS issues
            try {
              console.log('🔄 Using backend proxy for document:', document.id)
              const backendUrl = getEnvConfig().backendUrl
              const contentUrl = `${backendUrl}/documents/${document.id}/content?owner_sub=${userId}`

              console.log('📡 Using proxied content URL:', contentUrl)
              console.log('✅ Backend will proxy S3 content to avoid CORS')
              setPdfUrl(contentUrl)
              return
            } catch (proxyError) {
              console.error('❌ Error setting up backend proxy:', proxyError)
            }
          } else {
            console.warn('⚠️ Document not found in collection details or missing S3 info')
          }
        } catch (collectionError) {
          console.error('❌ Collection endpoint failed:', collectionError)
        }
        
        // Fallback: try presigned URL with document's own S3 info
        if (document.s3Bucket && document.s3Key) {
          console.log('⚠️ Collection endpoint failed, trying presigned URL with document info')
          console.log('📄 Document S3 info:', {
            bucket: document.s3Bucket,
            key: document.s3Key,
            region: 'ap-southeast-5'
          })

          // Use backend proxy endpoint (fallback)
          try {
            console.log('🔄 Using backend proxy (fallback)...')
            const backendUrl = getEnvConfig().backendUrl
            const contentUrl = `${backendUrl}/documents/${document.id}/content?owner_sub=${userId}`

            console.log('📡 Using proxied content URL (fallback):', contentUrl)
            console.log('✅ Backend will proxy S3 content to avoid CORS (fallback)')
            setPdfUrl(contentUrl)
            return
          } catch (proxyError) {
            console.error('❌ Error setting up backend proxy (fallback):', proxyError)
          }
        }
        
        // Final fallback to static file
        setPdfUrl('/partnership.pdf')
        console.log('⚠️ Using fallback static PDF - S3 access failed')
        console.log('📄 Document info:', {
          hasS3Bucket: !!document.s3Bucket,
          hasS3Key: !!document.s3Key,
          s3Bucket: document.s3Bucket,
          s3Key: document.s3Key
        })
      } catch (error) {
        console.error('Error loading PDF URL:', error)
        setPdfError('Failed to load document')
      } finally {
        setPdfLoading(false)
      }
    }

    loadPdfUrl()
  }, [document])

  // PDF loading handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPdfLoading(false)
    setPdfError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    
    // Check if it's a CORS or 403 error
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      setPdfError('Document access blocked by CORS policy. Backend proxy needed to access S3 documents.')
    } else if (error.message.includes('403')) {
      setPdfError('Access forbidden. Document requires authentication or signed URL.')
    } else {
      setPdfError('Failed to load PDF document')
    }
    
    setPdfLoading(false)
  }

  const closeTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }

  // Handle text selection for AI analysis
  const handleTextSelection = useCallback(async () => {
    if (!isHighlightMode) return
    
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    
    const selectedText = selection.toString().trim()
    if (selectedText.length < 3) return // Ignore very short selections
    
    // Get the position of the selection
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const viewerRect = viewerRef.current?.getBoundingClientRect()
    
    if (viewerRect && selectedText) {
      setIsGeneratingExplanation(true)
      
      // Get surrounding context for better analysis
      const context = getSelectionContext(selectedText, range)
      
      try {
        // Call backend API for explanation
        const backendResponse = await api.explain.explainSentence(selectedText)
        
        console.log('Backend Response:', backendResponse.explanation) // Debug log
        
        // Convert backend response to tooltip format
        // The backend returns markdown format, so we need to convert it to HTML
        const htmlExplanation = convertMarkdownToHtml(backendResponse.explanation)
        
        setTooltip({
          content: htmlExplanation,
          x: rect.left - viewerRect.left + rect.width / 2,
          y: rect.top - viewerRect.top - 10,
          visible: true,
          selectedText: selectedText
        })
        
        // Add to highlighted terms
        setHighlightedTerms(prev => new Set([...prev, selectedText]))
        
      } catch (error) {
        console.error('Failed to analyze text:', error)
        
        // Try fallback to Gemini service if backend fails
        try {
          console.log('Backend failed, trying Gemini fallback...')
          const geminiResponse = await geminiService.analyzeText({
            selectedText,
            context: context,
            pageNumber: currentPage
          })
          
          setTooltip({
            content: geminiResponse.explanation,
            x: rect.left - viewerRect.left + rect.width / 2,
            y: rect.top - viewerRect.top - 10,
            visible: true,
            category: geminiResponse.category,
            selectedText: selectedText,
            confidence: geminiResponse.confidence
          })
        } catch (fallbackError) {
          console.error('Gemini fallback also failed:', fallbackError)
          
          // Final fallback explanation
          setTooltip({
            content: `"${selectedText}" - This text requires professional interpretation. The AI analysis service is currently unavailable.`,
            x: rect.left - viewerRect.left + rect.width / 2,
            y: rect.top - viewerRect.top - 10,
            visible: true,
            category: 'general',
            selectedText: selectedText,
            confidence: 0
          })
        }
      } finally {
        setIsGeneratingExplanation(false)
      }
    }
  }, [isHighlightMode, currentPage])

  // Convert markdown to HTML for display
  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      // Convert headers to bold text
      .replace(/^# (.+)$/gm, '<strong>$1</strong>')
      .replace(/^## (.+)$/gm, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<strong>$1</strong>')
      // Convert bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Convert bullet points to HTML list
      .replace(/^- (.+)$/gm, '• $1')
      // Convert line breaks
      .replace(/\n/g, '<br>')
      // Clean up multiple line breaks
      .replace(/<br><br>/g, '<br>')
  }

  // Get context around the selected text
  const getSelectionContext = (selectedText: string, range: Range): string => {
    try {
      // Get the parent element and extract surrounding text
      const parentElement = range.commonAncestorContainer.parentElement
      if (parentElement) {
        const fullText = parentElement.textContent || ''
        const selectedIndex = fullText.indexOf(selectedText)
        
        if (selectedIndex !== -1) {
          const start = Math.max(0, selectedIndex - 100)
          const end = Math.min(fullText.length, selectedIndex + selectedText.length + 100)
          return fullText.substring(start, end)
        }
      }
    } catch (error) {
      console.error('Failed to get context:', error)
    }
    return ''
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'clause': return 'bg-blue-500'
      case 'legal-term': return 'bg-purple-500'
      case 'obligation': return 'bg-orange-500'
      case 'right': return 'bg-green-500'
      case 'warning': return 'bg-red-500'
      case 'general': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const getTooltipStyle = (category: string) => {
    switch (category) {
      case 'clause': return 'border-blue-200 bg-blue-50'
      case 'legal-term': return 'border-purple-200 bg-purple-50'
      case 'obligation': return 'border-orange-200 bg-orange-50'
      case 'right': return 'border-green-200 bg-green-50'
      case 'warning': return 'border-red-200 bg-red-50'
      case 'general': return 'border-indigo-200 bg-indigo-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  // Text selection event listeners
  useEffect(() => {
    const handleClickOutside = () => closeTooltip()
    globalThis.document.addEventListener('click', handleClickOutside)
    
    // Add text selection listener
    const handleSelectionChange = () => {
      if (isHighlightMode) {
        // Delay to ensure selection is complete
        setTimeout(handleTextSelection, 50)
      }
    }
    
    globalThis.document.addEventListener('mouseup', handleSelectionChange)
    globalThis.document.addEventListener('touchend', handleSelectionChange)
    
    return () => {
      globalThis.document.removeEventListener('click', handleClickOutside)
      globalThis.document.removeEventListener('mouseup', handleSelectionChange)
      globalThis.document.removeEventListener('touchend', handleSelectionChange)
    }
  }, [isHighlightMode, handleTextSelection])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
              <span className="text-red-600 text-xs font-bold">PDF</span>
            </div>
            <div>
              <h3 className="body-regular font-medium text-text-primary">{document.originalFilename}</h3>
              <p className="caption text-text-secondary">Document ID: {document.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Highlight Mode Toggle */}
            <Button
              variant={isHighlightMode ? 'primary' : 'ghost'}
              size="small"
              onClick={() => setIsHighlightMode(!isHighlightMode)}
              leftIcon={isHighlightMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              className="relative"
            >
              {isHighlightMode ? 'Exit Explainer' : 'Highlight Explainer'}
              {isHighlightMode && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </Button>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border border-gray-200 rounded-lg p-1">
              <Button
                variant="ghost"
                size="small"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="p-1"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="caption text-text-secondary px-2">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="small"
                onClick={() => setZoom(Math.min(2.0, zoom + 0.25))}
                className="p-1"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="small" className="p-2">
              <Download className="w-4 h-4" />
            </Button>

            {onClose && (
              <Button variant="ghost" size="small" onClick={onClose} className="p-2">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Highlight Mode Info Banner */}
        <AnimatePresence>
          {isHighlightMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200 px-4 py-3"
            >
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <span className="body-small text-yellow-800">
                  <strong>AI Highlight Explainer Active:</strong> Select any text for <strong>concise, layman-friendly explanations</strong> with highlighted key points. 
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded mx-1"></span>Legal Terms
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded mx-1"></span>Clauses
                  <span className="inline-block w-3 h-3 bg-orange-500 rounded mx-1"></span>Obligations
                  <span className="inline-block w-3 h-3 bg-green-500 rounded mx-1"></span>Rights
                  <span className="inline-block w-3 h-3 bg-red-500 rounded mx-1"></span>Warnings
                  <span className="inline-block w-3 h-3 bg-indigo-500 rounded mx-1"></span>General
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Content */}
        <div 
          ref={viewerRef}
          className="flex-1 overflow-auto p-6 bg-white relative"
        >
          <div className="max-w-4xl mx-auto">
            {pdfLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-primary mb-4" />
                  <p className="body-regular text-text-secondary">Loading PDF document...</p>
                </div>
              </div>
            )}
            
            {pdfError && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="heading-3 mb-2 text-red-700">Error Loading PDF</h3>
                  <p className="body-regular text-red-600 mb-4">{pdfError}</p>
                  <Button onClick={() => window.location.reload()} variant="secondary">
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {pdfUrl && !pdfLoading && !pdfError && (
              <div 
                className={`bg-white shadow-lg rounded-lg border border-gray-200 ${
                  isHighlightMode ? 'select-text cursor-text' : 'select-none'
                }`}
                style={{ userSelect: isHighlightMode ? 'text' : 'none' }}
              >
                <PDFDocument
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-primary" />
                    </div>
                  }
                  error={
                    <div className="text-center py-8 text-red-600">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>Failed to load PDF</p>
                    </div>
                  }
                >
                  <Page 
                    pageNumber={currentPage}
                    scale={zoom}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-sm"
                  />
                </PDFDocument>
                
                {/* Page Navigation */}
                {numPages && numPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 border-t">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="body-small text-text-secondary">
                      Page {currentPage} of {numPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                      disabled={currentPage >= numPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loading Indicator for AI Explanation */}
          <AnimatePresence>
            {isGeneratingExplanation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-4 right-4 z-50 bg-indigo-100 border border-indigo-200 rounded-lg p-3 shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                  <span className="body-small text-indigo-700 font-medium">
                    AI analyzing text...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Tooltip */}
          <AnimatePresence>
            {tooltip.visible && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className={`absolute z-50 max-w-sm max-h-96 overflow-y-auto p-3 rounded-lg shadow-xl border-2 ${getTooltipStyle(tooltip.category || 'general')}`}
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translateX(-50%)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(tooltip.category || 'general')} flex-shrink-0 mt-1`}></div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="body-small text-text-primary leading-relaxed [&_strong]:font-bold [&_strong]:text-gray-900"
                      dangerouslySetInnerHTML={{ __html: tooltip.content }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        {tooltip.category && (
                          <span className="caption text-text-secondary capitalize">
                            {tooltip.category.replace('-', ' ')}
                          </span>
                        )}
                        {tooltip.confidence !== undefined && tooltip.confidence > 0 && (
                          <span className="caption text-text-secondary">
                            • {tooltip.confidence}% confidence
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={closeTooltip}
                        className="p-1 text-xs"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Tooltip Arrow */}
                <div 
                  className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${
                    tooltip.category === 'warning' ? 'border-t-red-200' :
                    tooltip.category === 'right' ? 'border-t-green-200' :
                    tooltip.category === 'obligation' ? 'border-t-orange-200' :
                    tooltip.category === 'clause' ? 'border-t-blue-200' :
                    tooltip.category === 'legal-term' ? 'border-t-purple-200' :
                    tooltip.category === 'general' ? 'border-t-indigo-200' :
                    'border-t-gray-200'
                  }`}
                ></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-text-secondary body-small">
              <span>
                {numPages ? `Page ${currentPage} of ${numPages}` : 'Loading...'}
              </span>
              {isHighlightMode && (
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span>{highlightedTerms.size} terms explained</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="caption text-text-secondary">
                {isHighlightMode ? 'AI-powered legal analysis' : 'Legal document viewer'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}