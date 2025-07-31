"use client"

import { motion } from "framer-motion"
import { Loader2, Loader, Activity } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
  variant?: "spinner" | "dots" | "pulse" | "bars" | "ripple"
  color?: string
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  className = "",
  variant = "spinner",
  color = "#4c4a4a"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return <LoadingDots className={className} color={color} />
      case "pulse":
        return <LoadingPulse className={className} color={color} />
      case "bars":
        return <LoadingBars className={className} color={color} />
      case "ripple":
        return <LoadingRipple className={className} color={color} />
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <Loader2 className={`${sizeClasses[size]} text-[${color}]`} />
          </motion.div>
        )
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {renderSpinner()}
      {text && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#4c4a4a] font-medium text-sm"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  )
}

export function LoadingDots({ 
  className = "",
  color = "#4c4a4a"
}: { 
  className?: string;
  color?: string;
}) {
  return (
    <motion.div 
      className={`flex items-center justify-center gap-1 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full`}
          style={{ backgroundColor: color }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  )
}

export function LoadingPulse({ 
  className = "",
  color = "#4c4a4a"
}: { 
  className?: string;
  color?: string;
}) {
  return (
    <motion.div 
      className={`w-4 h-4 rounded-full ${className}`}
      style={{ backgroundColor: color }}
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

export function LoadingBars({ 
  className = "",
  color = "#4c4a4a"
}: { 
  className?: string;
  color?: string;
}) {
  return (
    <motion.div 
      className={`flex items-center justify-center gap-1 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-4 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ 
            scaleY: [1, 2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  )
}

export function LoadingRipple({ 
  className = "",
  color = "#4c4a4a"
}: { 
  className?: string;
  color?: string;
}) {
  return (
    <motion.div 
      className={`relative w-8 h-8 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
        animate={{ 
          scale: [0, 1],
          opacity: [1, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
        animate={{ 
          scale: [0, 1],
          opacity: [1, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.5,
          ease: "easeOut"
        }}
      />
    </motion.div>
  )
}

export function LoadingSpinnerWithText({ 
  text = "Loading...",
  className = "",
  size = "md"
}: { 
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <LoadingSpinner size={size} />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[#4c4a4a] font-medium"
      >
        {text}
      </motion.p>
    </motion.div>
  )
}

export function LoadingOverlay({ 
  children,
  isLoading,
  text = "Loading...",
  className = ""
}: { 
  children: React.ReactNode;
  isLoading: boolean;
  text?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <LoadingSpinnerWithText text={text} />
        </motion.div>
      )}
    </div>
  )
}

export function LoadingButton({ 
  children,
  loading,
  loadingText = "Loading...",
  className = "",
  ...props
}: { 
  children: React.ReactNode;
  loading: boolean;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <motion.button
      disabled={loading}
      className={`relative ${className}`}
      whileHover={!loading ? { scale: 1.02 } : undefined}
      whileTap={!loading ? { scale: 0.98 } : undefined}
      {...props}
    >
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {children}
        </motion.div>
      )}
    </motion.button>
  )
} 