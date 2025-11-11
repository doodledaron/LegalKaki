'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, ZoomIn, ZoomOut, Download, X, AlertCircle, Loader2 } from 'lucide-react'
import { Document as PDFDocument, Page, pdfjs } from 'react-pdf'
import { geminiService } from '@/api/geminiService'
import { Document as DocumentType } from '@/types'
import { getFileBlob, blobToUrl } from '@/lib/indexedDB-utils'

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
}

interface PDFViewerProps {
  document: DocumentType
  onClose?: () => void
}

export function PDFViewer({ document, onClose }: PDFViewerProps) {
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [zoom, setZoom] = useState(1.0)
  const [tooltip, setTooltip] = useState<Tooltip>({
    content: '',
    x: 0,
    y: 0,
    visible: false,
    category: ''
  })
  const [highlightedTerms, setHighlightedTerms] = useState<Set<string>>(new Set())
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const viewerRef = useRef<HTMLDivElement>(null)

  // Initialize PDF URL - Load from IndexedDB
  useEffect(() => {
    const loadPdfUrl = async () => {
      try {
        setPdfLoading(true)
        console.log('📄 Loading PDF from IndexedDB for document:', {
          id: document.id,
          filename: document.originalFilename,
          fileType: document.fileType
        })

        // Try to get file blob from IndexedDB
        const fileBlob = await getFileBlob(document.id)

        if (fileBlob && fileBlob.blob) {
          console.log('✅ Found file blob in IndexedDB')
          console.log('📦 Blob info:', {
            id: fileBlob.id,
            filename: fileBlob.filename,
            fileType: fileBlob.fileType,
            blobSize: fileBlob.blob.size
          })

          // Convert Blob to blob URL for viewing
          const blobUrl = blobToUrl(fileBlob.blob)

          if (blobUrl && blobUrl !== '#') {
            console.log('✅ Successfully created blob URL')
            setPdfUrl(blobUrl)
            setPdfError(null)
            return
          } else {
            console.error('❌ Failed to create blob URL')
            setPdfError('Failed to convert document data to viewable format')
          }
        } else {
          console.warn('⚠️ No file blob found in IndexedDB for document:', document.id)
          console.log('💡 Trying fallback static PDF...')

          // Fallback to static file
          setPdfUrl('/partnership.pdf')
          setPdfError(null)
          console.log('📄 Using fallback static PDF: /partnership.pdf')
        }
      } catch (error) {
        console.error('❌ Error loading PDF from IndexedDB:', error)
        setPdfError('Failed to load document from IndexedDB')

        // Try fallback as last resort
        try {
          console.log('🔄 Attempting final fallback to static PDF...')
          setPdfUrl('/partnership.pdf')
        } catch (fallbackError) {
          console.error('❌ Even fallback failed:', fallbackError)
        }
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

    // Simplified error messages for IndexedDB mode
    if (error.message.includes('Failed to fetch')) {
      setPdfError('Document not found. Please ensure the document is uploaded and stored.')
    } else if (error.message.includes('404')) {
      setPdfError('Document file not found.')
    } else {
      setPdfError('Failed to load PDF document. The document may not be available in storage.')
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
        // Use Gemini directly for text analysis (no backend/AWS dependencies)
        console.log('📝 Analyzing text with Gemini:', selectedText.substring(0, 50) + '...')
        const geminiResponse = await geminiService.analyzeText({
          selectedText,
          context: context,
          pageNumber: currentPage
        })

        console.log('✅ Gemini analysis complete:', geminiResponse.category)

        // Gemini already returns HTML with <strong> tags - use directly
        setTooltip({
          content: geminiResponse.explanation,
          x: rect.left - viewerRect.left + rect.width / 2,
          y: rect.top - viewerRect.top - 10,
          visible: true,
          category: geminiResponse.category,
          selectedText: selectedText
        })

        // Add to highlighted terms
        setHighlightedTerms(prev => new Set([...prev, selectedText]))

      } catch (error) {
        console.error('❌ Gemini analysis failed:', error)

        // Fallback explanation when AI is unavailable
        setTooltip({
          content: `"${selectedText}" - This text requires professional interpretation. The AI analysis service is currently unavailable.`,
          x: rect.left - viewerRect.left + rect.width / 2,
          y: rect.top - viewerRect.top - 10,
          visible: true,
          category: 'general',
          selectedText: selectedText
        })
      } finally {
        setIsGeneratingExplanation(false)
      }
    }
  }, [isHighlightMode, currentPage])

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
                <div className="flex flex-col">
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