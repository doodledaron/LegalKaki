'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, ZoomIn, ZoomOut, Download, X, Lightbulb } from 'lucide-react'

interface LegalTerm {
  word: string
  explanation: string
  category: 'clause' | 'legal-term' | 'obligation' | 'right' | 'warning'
}

interface Tooltip {
  content: string
  x: number
  y: number
  visible: boolean
  category: string
  selectedText?: string
}

interface PDFViewerProps {
  documentId: string
  filename: string
  onClose?: () => void
}

// Mock legal document content with interactive terms
const mockDocumentContent = `
EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on [DATE] between [COMPANY NAME], a company incorporated under the laws of Malaysia ("Company"), and [EMPLOYEE NAME] ("Employee").

1. POSITION AND DUTIES
The Employee is hereby engaged as [JOB TITLE] and shall perform such duties as may be assigned by the Company from time to time. The Employee agrees to devote their full time and attention to the business of the Company during normal working hours.

2. COMPENSATION AND BENEFITS
a) Basic Salary: The Company shall pay the Employee a basic salary of RM [AMOUNT] per month.
b) EPF Contribution: The Company will make mandatory contributions to the Employee's EPF account as required by law.
c) SOCSO: Both parties shall contribute to SOCSO as mandated by Malaysian employment legislation.
d) Annual Leave: The Employee is entitled to [NUMBER] days of annual leave per calendar year.

3. TERMINATION
Either party may terminate this Agreement by giving not less than one (1) month's written notice to the other party. The Company reserves the right to terminate this Agreement immediately for just cause, including but not limited to misconduct, breach of confidentiality, or violation of company policies.

4. CONFIDENTIALITY
The Employee acknowledges that during the course of employment, they may have access to confidential information belonging to the Company. The Employee agrees to maintain strict confidentiality and not to disclose such information to any third party.

5. NON-COMPETE CLAUSE
For a period of twelve (12) months after termination of employment, the Employee agrees not to engage in any business that competes directly with the Company's business within Malaysia.

6. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of Malaysia.
`

// Mock explanations for legal terms
const legalTerms: LegalTerm[] = [
  {
    word: "EPF",
    explanation: "Employees Provident Fund - A mandatory retirement savings scheme in Malaysia where both employer and employee contribute.",
    category: "legal-term"
  },
  {
    word: "SOCSO",
    explanation: "Social Security Organisation - Provides social security protection to employees through employment injury and invalidity pension schemes.",
    category: "legal-term"
  },
  {
    word: "just cause",
    explanation: "A legally valid reason for immediate termination, such as serious misconduct, theft, or breach of contract terms.",
    category: "legal-term"
  },
  {
    word: "confidential information",
    explanation: "Private company data including trade secrets, client lists, financial information, and proprietary methods.",
    category: "obligation"
  },
  {
    word: "non-compete clause",
    explanation: "A contract provision that prevents the employee from working for competitors or starting a competing business for a specified period.",
    category: "clause"
  },
  {
    word: "written notice",
    explanation: "Formal notification in writing (letter, email) required to terminate employment. Verbal notice is not sufficient.",
    category: "obligation"
  },
  {
    word: "annual leave",
    explanation: "Paid vacation days that employees are legally entitled to. Minimum 8 days per year under Malaysian Employment Act.",
    category: "right"
  },
  {
    word: "mandatory contributions",
    explanation: "Required by law - employer must contribute 12-13% of salary to EPF, cannot be waived or negotiated.",
    category: "obligation"
  },
  {
    word: "twelve (12) months",
    explanation: "⚠️ This is a long non-compete period. Malaysian courts may consider 6 months more reasonable for most positions.",
    category: "warning"
  }
]

export function PDFViewer({ documentId, filename, onClose }: PDFViewerProps) {
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [tooltip, setTooltip] = useState<Tooltip>({ content: '', x: 0, y: 0, visible: false, category: '' })
  const [highlightedTerms, setHighlightedTerms] = useState<Set<string>>(new Set())
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)
  const documentRef = useRef<HTMLDivElement>(null)

  const handleWordClick = (event: React.MouseEvent, word: string) => {
    if (!isHighlightMode) return
    
    event.preventDefault()
    event.stopPropagation()
    
    const term = legalTerms.find(t => 
      word.toLowerCase().includes(t.word.toLowerCase()) || 
      t.word.toLowerCase().includes(word.toLowerCase())
    )
    
    if (term) {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      const viewerRect = viewerRef.current?.getBoundingClientRect()
      
      if (viewerRect) {
        setTooltip({
          content: term.explanation,
          x: rect.left - viewerRect.left + rect.width / 2,
          y: rect.top - viewerRect.top - 10,
          visible: true,
          category: term.category
        })
        
        setHighlightedTerms(prev => new Set([...prev, term.word]))
      }
    }
  }

  const closeTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }

  // Generate AI explanation for any selected text
  const generateExplanation = (text: string): string => {
    // Mock AI explanation generator - in real app this would call an AI API
    const lowerText = text.toLowerCase()
    
    // Check for specific legal patterns and provide explanations
    if (lowerText.includes('shall') || lowerText.includes('agrees to')) {
      return `This creates a legal obligation. "${text}" means this is a binding requirement that must be fulfilled by the specified party.`
    }
    
    if (lowerText.includes('may') || lowerText.includes('reserves the right')) {
      return `This gives optional power or discretion. "${text}" means the party has the choice to take this action but is not required to.`
    }
    
    if (lowerText.includes('written notice') || lowerText.includes('in writing')) {
      return `This requires formal documentation. "${text}" means verbal communication is not sufficient - it must be documented in writing (email, letter, etc.).`
    }
    
    if (lowerText.includes('terminate') || lowerText.includes('termination')) {
      return `This relates to ending the agreement. "${text}" refers to the conditions and procedures for ending this employment relationship.`
    }
    
    if (lowerText.includes('confidential') || lowerText.includes('proprietary')) {
      return `This concerns private information protection. "${text}" refers to sensitive company information that must be kept secret and not shared with others.`
    }
    
    if (lowerText.includes('month') || lowerText.includes('days')) {
      return `This is a time period requirement. "${text}" specifies the duration or deadline that must be followed for this provision.`
    }
    
    if (lowerText.includes('epf') || lowerText.includes('socso')) {
      return `This refers to Malaysian statutory benefits. "${text}" relates to mandatory employee benefits required by Malaysian employment law.`
    }
    
    if (lowerText.includes('competing') || lowerText.includes('compete')) {
      return `This is a non-compete restriction. "${text}" prevents you from working for competitors or starting a competing business for the specified period.`
    }
    
    if (lowerText.includes('laws of malaysia') || lowerText.includes('malaysian')) {
      return `This establishes legal jurisdiction. "${text}" means Malaysian courts and laws will govern any disputes or interpretations of this agreement.`
    }
    
    // Default explanation for any other text
    return `"${text}" - This appears to be a legal provision that establishes rights, obligations, or procedures. In legal documents, this type of language creates binding commitments between the parties involved.`
  }

  // Handle text selection
  const handleTextSelection = useCallback(() => {
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
      
      // Simulate AI processing delay
      setTimeout(() => {
        const explanation = generateExplanation(selectedText)
        
        setTooltip({
          content: explanation,
          x: rect.left - viewerRect.left + rect.width / 2,
          y: rect.top - viewerRect.top - 10,
          visible: true,
          category: 'selected-text',
          selectedText: selectedText
        })
        
        setIsGeneratingExplanation(false)
      }, 800) // Simulate AI processing time
    }
  }, [isHighlightMode])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'clause': return 'bg-blue-500'
      case 'legal-term': return 'bg-purple-500'
      case 'obligation': return 'bg-orange-500'
      case 'right': return 'bg-green-500'
      case 'warning': return 'bg-red-500'
      case 'selected-text': return 'bg-indigo-500'
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
      case 'selected-text': return 'border-indigo-200 bg-indigo-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const renderHighlightableText = (text: string) => {
    if (!isHighlightMode) {
      return <span>{text}</span>
    }

    const words = text.split(/(\s+)/)
    return words.map((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase()
      const matchedTerm = legalTerms.find(term => 
        cleanWord.includes(term.word.toLowerCase()) || 
        term.word.toLowerCase().includes(cleanWord)
      )

      if (matchedTerm && cleanWord.length > 2) {
        const isHighlighted = highlightedTerms.has(matchedTerm.word)
        return (
          <span
            key={index}
            onClick={(e) => handleWordClick(e, word)}
            className={`cursor-pointer transition-all duration-200 ${
              isHighlighted 
                ? `${getCategoryColor(matchedTerm.category)} text-white px-1 rounded`
                : 'hover:bg-yellow-200 hover:shadow-sm px-1 rounded'
            }`}
            title={isHighlightMode ? "Click for explanation" : ""}
          >
            {word}
          </span>
        )
      }
      
      return <span key={index}>{word}</span>
    })
  }

  useEffect(() => {
    const handleClickOutside = () => closeTooltip()
    document.addEventListener('click', handleClickOutside)
    
    // Add text selection listener
    const handleSelectionChange = () => {
      if (isHighlightMode) {
        // Delay to ensure selection is complete
        setTimeout(handleTextSelection, 50)
      }
    }
    
    document.addEventListener('mouseup', handleSelectionChange)
    document.addEventListener('touchend', handleSelectionChange)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('mouseup', handleSelectionChange)
      document.removeEventListener('touchend', handleSelectionChange)
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
              <h3 className="body-regular font-medium text-text-primary">{filename}</h3>
              <p className="caption text-text-secondary">Document ID: {documentId}</p>
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
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                className="p-1"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="caption text-text-secondary px-2">{zoom}%</span>
              <Button
                variant="ghost"
                size="small"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
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
                  <strong>Highlight Explainer Mode Active:</strong> Click on highlighted legal terms OR select any text to get AI explanations. 
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded mx-1"></span>Legal Terms
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded mx-1"></span>Clauses
                  <span className="inline-block w-3 h-3 bg-orange-500 rounded mx-1"></span>Obligations
                  <span className="inline-block w-3 h-3 bg-green-500 rounded mx-1"></span>Rights
                  <span className="inline-block w-3 h-3 bg-red-500 rounded mx-1"></span>Warnings
                  <span className="inline-block w-3 h-3 bg-indigo-500 rounded mx-1"></span>Selected Text
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Content */}
        <div 
          ref={viewerRef}
          className="flex-1 overflow-auto p-6 bg-white relative"
          style={{ fontSize: `${zoom}%` }}
        >
          <div className="max-w-3xl mx-auto">
            <div 
              ref={documentRef}
              className={`bg-white shadow-lg rounded-lg p-8 border border-gray-200 ${
                isHighlightMode ? 'select-text cursor-text' : 'select-none'
              }`}
              style={{ userSelect: isHighlightMode ? 'text' : 'none' }}
            >
              <div className="space-y-4 leading-relaxed text-gray-800">
                {mockDocumentContent.split('\n\n').map((paragraph, index) => (
                  <div key={index}>
                    {paragraph.trim() && (
                      <p className="mb-4">
                        {renderHighlightableText(paragraph.trim())}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                    Generating explanation...
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
                className={`absolute z-50 max-w-sm p-3 rounded-lg shadow-xl border-2 ${getTooltipStyle(tooltip.category)}`}
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translateX(-50%)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(tooltip.category)} flex-shrink-0 mt-1`}></div>
                  <div>
                    {tooltip.selectedText && (
                      <div className="mb-2 p-2 bg-white/60 rounded border">
                        <span className="caption text-text-secondary">Selected text:</span>
                        <p className="body-small font-medium text-text-primary italic">
                          &ldquo;{tooltip.selectedText}&rdquo;
                        </p>
                      </div>
                    )}
                    <p className="body-small text-text-primary leading-relaxed">
                      {tooltip.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="caption text-text-secondary capitalize">
                        {tooltip.category === 'selected-text' ? 'AI Explanation' : tooltip.category.replace('-', ' ')}
                      </span>
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
                    tooltip.category === 'selected-text' ? 'border-t-indigo-200' :
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
              <span>Page 1 of 1</span>
              {isHighlightMode && (
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span>{highlightedTerms.size} terms explained</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="caption text-text-secondary">Legal document analysis</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
