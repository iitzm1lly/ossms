"use client"

import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ReactNode } from "react"

// Animation variants for consistent, smooth animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
}

const fadeInLeft = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

const fadeInRight = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

const slideInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 }
}

const slideInDown = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 30 }
}

const slideInLeft = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 }
}

const slideInRight = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 }
}

// Stagger children animation
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// Smooth easing functions
const smoothEase = [0.4, 0.0, 0.2, 1]
const bounceEase = [0.68, -0.55, 0.265, 1.55]
const elasticEase = [0.175, 0.885, 0.32, 1.275]

interface PageTransitionProps {
  children: ReactNode
  className?: string
  direction?: "up" | "down" | "left" | "right"
  duration?: number
  delay?: number
}

export function PageTransition({ 
  children, 
  className = "", 
  direction = "up",
  duration = 0.4,
  delay = 0
}: PageTransitionProps) {
  const variants = {
    up: fadeInUp,
    down: fadeInDown,
    left: fadeInLeft,
    right: fadeInRight
  }

  return (
    <MotionConfig transition={{ duration, ease: smoothEase }}>
      <motion.div
        variants={variants[direction]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ delay }}
        className={className}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.4,
  className = ""
}: { 
  children: ReactNode; 
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration, 
        delay,
        ease: smoothEase
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({ 
  children, 
  direction = "up", 
  delay = 0,
  duration = 0.4,
  className = ""
}: { 
  children: ReactNode; 
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const variants = {
    up: slideInUp,
    down: slideInDown,
    left: slideInLeft,
    right: slideInRight
  }

  return (
    <motion.div
      variants={variants[direction]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration, 
        delay,
        ease: smoothEase
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ 
  children, 
  delay = 0,
  duration = 0.3,
  className = ""
}: { 
  children: ReactNode; 
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration, 
        delay,
        ease: smoothEase
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedCard({ 
  children, 
  delay = 0,
  className = "",
  hover = true
}: { 
  children: ReactNode; 
  delay?: number;
  className?: string;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={hover ? { 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2, ease: smoothEase }
      } : undefined}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: smoothEase
      }}
      className={`transition-shadow duration-200 hover:shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedTableRow({ 
  children, 
  index = 0,
  className = ""
}: { 
  children: ReactNode; 
  index?: number;
  className?: string;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: smoothEase
      }}
      whileHover={{ 
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        transition: { duration: 0.2 }
      }}
      className={`border-b border-gray-100 ${className}`}
    >
      {children}
    </motion.tr>
  )
}

export function AnimatedBadge({ 
  children, 
  delay = 0, 
  className = "", 
  ...props 
}: { 
  children: ReactNode; 
  delay?: number; 
  className?: string; 
  [key: string]: any 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        duration: 0.2, 
        delay,
        ease: smoothEase
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ 
  children, 
  className = "",
  staggerDelay = 0.1
}: { 
  children: ReactNode; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ 
  children, 
  className = ""
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedButton({ 
  children, 
  delay = 0,
  className = "",
  ...props 
}: { 
  children: ReactNode; 
  delay?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2, ease: smoothEase }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: smoothEase
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function AnimatedInput({ 
  children, 
  delay = 0,
  className = "",
  ...props 
}: { 
  children: ReactNode; 
  delay?: number;
  className?: string;
  [key: string]: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: smoothEase
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedIcon({ 
  children, 
  delay = 0,
  className = "",
  hover = true,
  ...props 
}: { 
  children: ReactNode; 
  delay?: number;
  className?: string;
  hover?: boolean;
  [key: string]: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={hover ? { 
        scale: 1.1,
        rotate: 5,
        transition: { duration: 0.2, ease: smoothEase }
      } : undefined}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: smoothEase
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedProgress({ 
  progress, 
  delay = 0,
  className = "",
  duration = 0.8
}: { 
  progress: number; 
  delay?: number;
  className?: string;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ 
        duration, 
        delay,
        ease: smoothEase
      }}
      className={`h-2 bg-primary rounded-full ${className}`}
    />
  )
}

export function AnimatedCounter({ 
  value, 
  delay = 0,
  duration = 1,
  className = ""
}: { 
  value: number; 
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: smoothEase
      }}
      className={className}
    >
      <motion.span
        initial={{ number: 0 }}
        animate={{ number: value }}
        transition={{ 
          duration, 
          delay: delay + 0.1,
          ease: smoothEase
        }}
      >
        {Math.round(value)}
      </motion.span>
    </motion.span>
  )
} 