"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkAuth = async () => {
      try {
        const isLoggedInStr = localStorage.getItem('isLoggedIn')
        const userStr = localStorage.getItem('user')
        
        if (isLoggedInStr !== 'true' || !userStr) {
          router.push('/')
          return
        }

        const user = JSON.parse(userStr)
        if (!user || !user.username) {
          router.push('/')
          return
        }

        // Authentication successful, stop loading and clear timeout
        clearTimeout(timeoutId)
        setIsLoading(false)
      } catch (error) {
        router.push('/')
      }
    }

    // Add timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      setIsLoading(false)
    }, 5000) // 5 second timeout

    checkAuth()

    return () => clearTimeout(timeoutId)
  }, [router])

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen bg-[#d5d3b8]"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
        >
          <LoadingSpinner size="lg" text="Loading..." variant="ripple" />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="flex min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
    >
      <motion.div
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
      >
        <DashboardSidebar />
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.main 
          key={typeof window !== 'undefined' ? window.location.pathname : 'default'}
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.95 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.4, 0.0, 0.2, 1],
            staggerChildren: 0.1
          }}
          className="flex-1 ml-[320px] bg-[#d5d3b8] min-h-screen"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </motion.main>
      </AnimatePresence>
    </motion.div>
  )
}

