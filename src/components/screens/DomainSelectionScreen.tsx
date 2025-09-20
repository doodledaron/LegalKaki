'use client'

import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { LEGAL_DOMAINS } from '@/constants/domains'
import { LegalDomain } from '@/types'
import { useState, useEffect } from 'react'

// Single purple color for all domain cards
const domainColors = {
  business: { bg: 'bg-purple-primary', glow: 'shadow-purple-primary/50' },
  employment: { bg: 'bg-purple-primary', glow: 'shadow-purple-primary/50' },
  property: { bg: 'bg-purple-primary', glow: 'shadow-purple-primary/50' },
  marriage: { bg: 'bg-purple-primary', glow: 'shadow-purple-primary/50' }
}

// Simplified card animation variants
const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.9
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 200, damping: 25 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 }
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 200 : -200,
    opacity: 0,
    scale: 0.9,
    transition: {
      x: { type: "spring", stiffness: 200, damping: 25 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 }
    }
  })
}

// Simplified sparkle animation
const sparkleVariants = {
  animate: {
    scale: [0, 1, 0],
    opacity: [0, 0.8, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop" as const,
      ease: "easeInOut"
    }
  }
}

interface DomainSelectionScreenProps {
  onBack: () => void
  onDomainSelect: (domain: LegalDomain) => void
  onUnsure: () => void
}

export function DomainSelectionScreen({ onBack, onDomainSelect, onUnsure }: DomainSelectionScreenProps) {
  const domains = Object.values(LEGAL_DOMAINS)
    .filter(domain => domain.id !== 'general')
    .sort((a, b) => {
      // Make partnership (marriage) first
      if (a.id === 'marriage') return -1
      if (b.id === 'marriage') return 1
      return 0
    })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isSelected, setIsSelected] = useState(false)

  const currentDomain = domains[currentIndex]

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection: number) => {
    const newIndex = currentIndex + newDirection
    if (newIndex >= 0 && newIndex < domains.length) {
      setDirection(newDirection)
      setCurrentIndex(newIndex)
      setIsSelected(false)
    }
  }

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipe = swipePower(info.offset.x, info.velocity.x)

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1)
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1)
    }
  }

  const handleCardSelect = () => {
    setIsSelected(true)
    // Immediate transition with just enough time for visual feedback
    setTimeout(() => {
      onDomainSelect(currentDomain.id as LegalDomain)
    }, 200)
  }

  // Auto-advance cards for demo (optional)
  useEffect(() => {
    if (isSelected) return
    
    const timer = setInterval(() => {
      const newIndex = currentIndex + 1
      if (newIndex < domains.length) {
        setDirection(1)
        setCurrentIndex(newIndex)
        setIsSelected(false)
      }
    }, 8000) // Auto advance every 8 seconds

    return () => clearInterval(timer)
  }, [currentIndex, isSelected, domains.length])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="relative p-4 sm:p-6 pb-4">
        <Button
          variant="ghost"
          size="small"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="absolute left-4 top-4 z-10"
        >
          Back
        </Button>
        
        <motion.div 
          className="text-center pt-12 sm:pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="heading-2 mb-3"
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.2, 
              type: "spring", 
              stiffness: 100, 
              damping: 12 
            }}
          >
            What do you want to ask?
          </motion.h1>
          <motion.p 
            className="body-regular text-text-secondary mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.5,
              ease: "easeOut"
            }}
          >
            Swipe or tap to explore legal domains
          </motion.p>
        </motion.div>
      </div>

      {/* Main Card Carousel */}
      <motion.div 
        className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.8,
          ease: "easeOut"
        }}
      >
        <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg h-[400px] sm:h-[450px] md:h-[500px]">
          
          {/* Navigation Buttons */}
          <button
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 transition-all hover:bg-white hover:scale-110"
            onClick={() => paginate(-1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          <button
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 transition-all hover:bg-white hover:scale-110"
            onClick={() => paginate(1)}
            disabled={currentIndex === domains.length - 1}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>

          {/* Card Container */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDrag}
                className="absolute w-full h-full cursor-pointer"
              >
                <Card 
                  className={`
                    relative w-full h-full overflow-hidden border-0 shadow-2xl
                    ${domainColors[currentDomain.id as keyof typeof domainColors]?.bg || 'bg-purple-primary'}
                    ${isSelected ? `${domainColors[currentDomain.id as keyof typeof domainColors]?.glow || 'shadow-purple-primary/50'} shadow-2xl` : 'shadow-xl'}
                    transform-gpu
                  `}
                  onClick={handleCardSelect}
                >
                  {/* Sparkle Effects - Only when selected */}
                  {isSelected && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-white rounded-full"
                          style={{
                            left: `${15 + (i * 12)}%`,
                            top: `${20 + (i * 8)}%`,
                          }}
                          variants={sparkleVariants}
                          animate="animate"
                          transition={{
                            delay: i * 0.05,
                            duration: 0.3
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Glass morphism overlay */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  
                  {/* Card Content */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6 sm:p-8">
                    {/* Icon */}
                    <motion.div 
                      className="mb-6 sm:mb-8"
                      animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      {currentDomain.icon && (
                        <currentDomain.icon className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-white drop-shadow-lg" />
                      )}
                    </motion.div>
                    
                    {/* Title */}
                    <motion.h3 
                      className="heading-1 sm:text-4xl md:text-5xl text-white font-bold tracking-tight"
                      animate={isSelected ? { scale: 1.01 } : { scale: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      {currentDomain.title}
                    </motion.h3>

                    {/* Selection Feedback */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-2xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      />
                    )}
                  </div>

                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-transparent to-white/20 p-0.5">
                    <div className="h-full w-full rounded-2xl bg-transparent" />
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2 mt-6 sm:mt-8">
          {domains.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-purple-primary scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
                setIsSelected(false)
              }}
            />
          ))}
        </div>

        {/* Current Card Info */}
        <motion.div 
          className="text-center mt-4 sm:mt-6"
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="body-small text-text-secondary">
            {currentIndex + 1} of {domains.length}
          </p>
        </motion.div>
      </motion.div>

      {/* Alternative Action */}
      <div className="flex justify-center px-4 sm:px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: 1.2,
            ease: "easeOut"
          }}
          className="w-full max-w-sm"
        >
          <Button
            variant="secondary"
            fullWidth={true}
            onClick={onUnsure}
            className="relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-purple-subtle"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative z-10">I&apos;m not sure / Other</span>
          </Button>
        </motion.div>
      </div>

      {/* Simplified Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Subtle purple gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-20 w-32 h-32 bg-purple-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-20 w-28 h-28 bg-purple-light/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.1, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
      </div>
    </div>
  )
}
