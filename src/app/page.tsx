'use client'


import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

// POC Mode: Redirect directly to /domains page (no welcome screen needed)
export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 inline-block"
        >
          <div className="w-20 h-20 bg-purple-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-purple-primary/20">
            <span className="text-white font-bold text-4xl">L</span>
          </div>
        </motion.div>

        <h1 className="heading-1 mb-6 text-text-primary">
          Welcome to <span className="text-purple-primary">LegalKaki</span>
        </h1>

        <p className="body-large text-text-secondary mb-10 max-w-lg mx-auto">
          Making legal information accessible, understandable, and actionable for every rakyat.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/domains')}
          className="bg-purple-primary text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-purple-primary/25 hover:shadow-xl hover:shadow-purple-primary/30 transition-all duration-300 flex items-center mx-auto gap-2"
        >
          Start Now
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  )
}
