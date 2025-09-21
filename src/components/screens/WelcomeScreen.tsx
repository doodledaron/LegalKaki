/* eslint-disable @next/next/no-img-element */
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface WelcomeScreenProps {
  onGetStarted: () => void
  onViewCollection?: () => void
}

export function WelcomeScreen({ onGetStarted, onViewCollection }: WelcomeScreenProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = () => {
    setIsLoading(true)
    // Simulate loading
    setTimeout(() => {
      onGetStarted()
      setIsLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-gray-50 to-purple-subtle/30" />
      
      {/* Floating Purple Orbs */}
      <motion.div 
        className="absolute top-20 right-10 w-40 h-40 rounded-full bg-purple-primary/20 blur-2xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.6, 0.9, 0.6],
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-32 left-10 w-36 h-36 rounded-full bg-purple-light/25 blur-xl"
        animate={{
          scale: [1.2, 0.8, 1.2],
          opacity: [0.7, 1, 0.7],
          x: [0, -30, 0],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
      />
      
      {/* Additional Floating Elements */}
      <motion.div 
        className="absolute top-1/3 left-1/4 w-24 h-24 rounded-full bg-purple-primary/15 blur-lg"
        animate={{
          scale: [0.8, 1.4, 0.8],
          opacity: [0.4, 0.8, 0.4],
          x: [0, 50, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/3 w-28 h-28 rounded-full bg-purple-light/20 blur-xl"
        animate={{
          scale: [1, 0.6, 1],
          opacity: [0.5, 0.9, 0.5],
          x: [0, -35, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      {/* Enhanced Gradient Waves */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-primary/8 via-transparent to-purple-light/10"
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-purple-subtle/15 to-transparent"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 2, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
      />
      
      {/* More Visible Moving Particles */}
      <motion.div 
        className="absolute top-16 left-16 w-4 h-4 rounded-full bg-purple-primary/40"
        animate={{
          x: [0, 150, 300, 150, 0],
          y: [0, -80, 0, 80, 0],
          opacity: [0, 1, 0.7, 1, 0],
          scale: [0.5, 1, 0.8, 1, 0.5],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-3 h-3 rounded-full bg-purple-light/50"
        animate={{
          x: [0, -120, -240, -120, 0],
          y: [0, 50, 0, -50, 0],
          opacity: [0, 0.8, 1, 0.8, 0],
          scale: [0.3, 1.2, 0.9, 1.2, 0.3],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 7
        }}
      />
      <motion.div 
        className="absolute top-1/2 right-12 w-2.5 h-2.5 rounded-full bg-purple-primary/60"
        animate={{
          x: [0, -80, -160, -80, 0],
          y: [0, -40, 0, 40, 0],
          opacity: [0, 0.9, 0.6, 0.9, 0],
          scale: [0.4, 1.1, 0.7, 1.1, 0.4],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      />
      
      {/* New Large Floating Elements */}
      <motion.div 
        className="absolute top-10 left-1/2 w-32 h-32 rounded-full bg-purple-subtle/30 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.7, 0.3],
          x: [0, -60, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6
        }}
      />
      <motion.div 
        className="absolute bottom-10 left-1/3 w-44 h-44 rounded-full bg-purple-primary/12 blur-3xl"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.4, 0.8, 0.4],
          x: [0, 70, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8
        }}
      />

      {/* Main Content */}
      <motion.div 
        className="relative z-10 text-center max-w-sm mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo Icon */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <img 
            src="/Logo.png" 
            alt="LegalKaki Logo" 
            className="w-24 h-24 mx-auto mb-8 object-contain"
          />
        </motion.div>

        {/* Main Headline */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            <span className="text-text-primary">LegalKaki</span>
          </h1>
          
          <motion.p 
            className="text-text-secondary text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            AI Legal Assistant for the Rakyat
          </motion.p>
        </motion.div>

        {/* Get Started Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-8"
        >
          <motion.button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="group relative w-full bg-purple-primary text-white rounded-full py-5 px-8 text-lg font-semibold overflow-hidden shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Button background animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-light to-purple-dark opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
            
            {/* Button content */}
            <motion.div 
              className="relative z-10 flex items-center justify-center space-x-3"
              animate={isLoading ? { opacity: 0.7 } : { opacity: 1 }}
            >
              <span className="text-white transition-colors duration-300">
                {isLoading ? 'Loading...' : 'Get started'}
              </span>
              {!isLoading && (
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="w-5 h-5 text-white transition-colors duration-300" />
                </motion.div>
              )}
            </motion.div>

            {/* Loading animation */}
            {isLoading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-dark to-purple-light rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        </motion.div>

        {/* Secondary Action */}
        {onViewCollection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <button
              onClick={onViewCollection}
              className="text-text-secondary hover:text-purple-primary transition-colors duration-300 text-base underline underline-offset-4"
            >
              View existing collections
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom Brand */}
      <motion.div 
        className="absolute bottom-8 left-0 right-0 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <p className="text-text-secondary text-sm">
          LegalKaki - Powered by AI
        </p>
      </motion.div>
    </div>
  )
}
