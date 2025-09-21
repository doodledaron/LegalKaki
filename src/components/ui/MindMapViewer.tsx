'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { X, ZoomIn, ZoomOut, Download, Maximize2, Brain, AlertTriangle, CheckCircle, FileText, MessageCircle, ExternalLink } from 'lucide-react'
import mermaid from 'mermaid'
import { EnhancedMindMapData, InteractiveMindMapNode } from '@/lib/mindMapGenerator'

interface MindMapViewerProps {
  isOpen: boolean
  onClose: () => void
  mermaidCode: string
  title: string
  enhancedData?: EnhancedMindMapData
  onNodeClick?: (node: InteractiveMindMapNode) => void
}

export function MindMapViewer({ isOpen, onClose, mermaidCode, title, enhancedData, onNodeClick }: MindMapViewerProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mermaidInitialized, setMermaidInitialized] = useState(false)
  const [showInsightsPanel, setShowInsightsPanel] = useState(false)
  const [selectedNode, setSelectedNode] = useState<InteractiveMindMapNode | null>(null)

  useEffect(() => {
    // Initialize Mermaid only once
    if (!mermaidInitialized) {
      try {
        console.log('🔧 Initializing Mermaid...')
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          mindmap: {
            padding: 20
          }
        })
        setMermaidInitialized(true)
        console.log('✅ Mermaid initialized successfully')
      } catch (err) {
        console.error('❌ Mermaid initialization failed:', err)
      }
    }
  }, [mermaidInitialized])

  useEffect(() => {
    if (isOpen && mermaidCode && mermaidInitialized) {
      console.log('🎯 useEffect triggered, checking ref...')
      // Try multiple times with increasing delays
      let attempts = 0
      const maxAttempts = 10
      
      const checkRef = () => {
        attempts++
        if (mermaidRef.current) {
          console.log(`✅ Ref ready after ${attempts} attempts, calling renderMindMap...`)
          renderMindMap()
        } else if (attempts < maxAttempts) {
          console.log(`🔄 Attempt ${attempts}: Ref not ready, retrying...`)
          setTimeout(checkRef, 50 * attempts) // Increasing delay
        } else {
          console.log('❌ Ref still not ready after all attempts')
          setError('Failed to initialize mind map viewer')
          setIsLoading(false)
        }
      }
      
      checkRef()
    } else {
      console.log('🚫 useEffect conditions not met:', { 
        isOpen, 
        mermaidCode: !!mermaidCode, 
        mermaidInitialized 
      })
    }
  }, [isOpen, mermaidCode, mermaidInitialized])

  const renderMindMap = async () => {
    if (!mermaidRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      console.log('🧠 Starting mind map render...')
      console.log('📝 Mermaid code length:', mermaidCode.length)
      console.log('📋 Mermaid code preview:', mermaidCode.substring(0, 200) + '...')
      
      // Clear previous content
      mermaidRef.current.innerHTML = ''

      // Generate unique ID for this render
      const id = `mindmap-${Date.now()}`
      
      console.log('⏱️ Calling mermaid.render...')
      const startTime = performance.now()
      
      // Add a timeout to prevent hanging
      const renderPromise = mermaid.render(id, mermaidCode)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Mermaid render timeout after 10 seconds')), 10000)
      )
      
      // Render the mermaid diagram with timeout
      const { svg } = await Promise.race([renderPromise, timeoutPromise]) as { svg: string }
      
      const endTime = performance.now()
      console.log(`✅ Mermaid render completed in ${(endTime - startTime).toFixed(2)}ms`)
      
      // Insert the SVG
      mermaidRef.current.innerHTML = svg

      // Add some basic styling to the SVG
      const svgElement = mermaidRef.current.querySelector('svg')
      if (svgElement) {
        svgElement.style.maxWidth = '100%'
        svgElement.style.height = 'auto'
        svgElement.style.display = 'block'
        svgElement.style.margin = '0 auto'
      }

      console.log('🎉 Mind map rendered successfully!')
      
      // Add click handlers if we have enhanced data
      if (enhancedData && onNodeClick) {
        setupNodeClickHandlers()
      }
      
      setIsLoading(false)
    } catch (err) {
      console.error('❌ Mermaid rendering error:', err)
      console.error('📝 Failed code:', mermaidCode)
      
      // Try a super simple fallback
      try {
        console.log('🔄 Trying simple fallback...')
        const simpleFallback = `mindmap
  root((Collection))
    Documents
    Actions
    Summary`
        
        const fallbackId = `fallback-${Date.now()}`
        const { svg: fallbackSvg } = await mermaid.render(fallbackId, simpleFallback)
        
        mermaidRef.current.innerHTML = fallbackSvg
        console.log('✅ Fallback rendered successfully!')
        setIsLoading(false)
        return
      } catch (fallbackErr) {
        console.error('❌ Even fallback failed:', fallbackErr)
      }
      
      setError('Failed to render mind map. Please try again.')
      setIsLoading(false)
    }
  }

  const setupNodeClickHandlers = () => {
    if (!mermaidRef.current || !enhancedData) return
    
    console.log('🖱️ Setting up node click handlers...')
    
    // Find all clickable elements in the SVG
    const svgElement = mermaidRef.current.querySelector('svg')
    if (!svgElement) return
    
    // Add click listeners to text elements (nodes)
    const textElements = svgElement.querySelectorAll('text')
    textElements.forEach((textElement, index) => {
      const textContent = textElement.textContent?.trim() || ''
      
      // Find matching node in enhanced data
      const matchingNode = enhancedData.nodes.find(node => {
        const nodeTitle = node.title.toLowerCase()
        const elementText = textContent.toLowerCase()
        return nodeTitle.includes(elementText) || elementText.includes(nodeTitle)
      })
      
      if (matchingNode && matchingNode.clickable) {
        console.log(`🔗 Adding click handler for: ${textContent}`)
        
        // Style the clickable element
        textElement.style.cursor = 'pointer'
        textElement.classList.add('clickable-node')
        
        // Add hover effects
        textElement.addEventListener('mouseenter', () => {
          textElement.style.fontWeight = 'bold'
          textElement.style.textDecoration = 'underline'
        })
        
        textElement.addEventListener('mouseleave', () => {
          textElement.style.fontWeight = 'normal'
          textElement.style.textDecoration = 'none'
        })
        
        // Add click handler
        textElement.addEventListener('click', (e) => {
          e.stopPropagation()
          console.log('🖱️ Node clicked:', matchingNode.title)
          setSelectedNode(matchingNode)
          if (onNodeClick) {
            onNodeClick(matchingNode)
          }
        })
      }
    })
  }


  const handleDownload = () => {
    const svgElement = mermaidRef.current?.querySelector('svg')
    if (!svgElement) return

    // Convert SVG to download
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{title} - Mind Map</h2>
              <p className="text-gray-600 mt-1">Visual overview of your collection</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {enhancedData && enhancedData.insights.keyThemes.length > 0 && (
                <Button
                  variant={showInsightsPanel ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => setShowInsightsPanel(!showInsightsPanel)}
                  leftIcon={<Brain className="w-4 h-4" />}
                >
                  AI Insights
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="small"
                onClick={handleDownload}
                leftIcon={<Download className="w-4 h-4" />}
                disabled={isLoading || !!error}
              >
                Download SVG
              </Button>
              
              <Button
                variant="ghost"
                size="small"
                onClick={onClose}
                leftIcon={<X className="w-4 h-4" />}
              >
                Close
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating mind map...</p>
                </div>
              </div>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <div className="text-red-600 mb-4">
                    <X className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Error</h3>
                    <p>{error}</p>
                  </div>
                  <Button 
                    onClick={renderMindMap}
                    variant="secondary"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Always render the container for the ref, but hide when loading/error */}
            <div className="text-center">
              <div
                ref={mermaidRef}
                className="mind-map-container"
                style={{ 
                  minHeight: '400px',
                  display: (!isLoading && !error) ? 'block' : 'none'
                }}
              />
              
              {!isLoading && !error && (
                <div className="mt-4 text-sm text-gray-500">
                  <p>💡 Tip: Right-click on the diagram to save as image</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI Insights Panel */}
        <AnimatePresence>
          {showInsightsPanel && enhancedData && (
            <motion.div
              className="absolute top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-xl overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    AI Insights
                  </h3>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setShowInsightsPanel(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Key Themes */}
                {enhancedData.insights.keyThemes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Key Themes
                    </h4>
                    <div className="space-y-2">
                      {enhancedData.insights.keyThemes.map(theme => (
                        <Card 
                          key={theme.id} 
                          className={`p-3 border-l-4 ${
                            theme.importance === 'high' ? 'border-red-500 bg-red-50' :
                            theme.importance === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-green-500 bg-green-50'
                          }`}
                        >
                          <div className="font-medium text-sm">{theme.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{theme.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {theme.relatedItems.length} related items
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {enhancedData.insights.riskFactors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1 text-orange-600" />
                      Risk Factors
                    </h4>
                    <div className="space-y-2">
                      {enhancedData.insights.riskFactors.map((risk, index) => (
                        <Card 
                          key={index} 
                          className={`p-3 border-l-4 ${
                            risk.severity === 'high' ? 'border-red-500 bg-red-50' :
                            risk.severity === 'medium' ? 'border-orange-500 bg-orange-50' :
                            'border-yellow-500 bg-yellow-50'
                          }`}
                        >
                          <div className="text-sm">{risk.description}</div>
                          <div className="text-xs text-gray-500 mt-1 capitalize">
                            {risk.severity} severity
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Urgent Actions */}
                {enhancedData.insights.urgentActions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-red-600" />
                      Urgent Actions
                    </h4>
                    <div className="space-y-2">
                      {enhancedData.insights.urgentActions.map(action => (
                        <Card key={action.id} className="p-3 border-l-4 border-red-500 bg-red-50">
                          <div className="font-medium text-sm">{action.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{action.reasoning}</div>
                          <div className="text-xs text-red-600 mt-1 font-medium">
                            Deadline: {action.suggestedDeadline}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {enhancedData.insights.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1 text-blue-600" />
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {enhancedData.insights.recommendations.map((rec, index) => (
                        <Card key={index} className="p-3 border-l-4 border-blue-500 bg-blue-50">
                          <div className="text-sm">{rec}</div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Help */}
                <Card className="p-3 bg-purple-50 border-purple-200">
                  <div className="text-sm text-purple-800">
                    <strong>💡 Tip:</strong> Click on nodes in the mind map to navigate to documents, conversations, or actions.
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
