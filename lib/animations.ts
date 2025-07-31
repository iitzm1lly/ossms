import { Variants } from "framer-motion"

// Smooth easing functions for consistent animations
export const smoothEase = [0.4, 0.0, 0.2, 1]
export const bounceEase = [0.68, -0.55, 0.265, 1.55]
export const elasticEase = [0.175, 0.885, 0.32, 1.275]
export const backEase = [0.175, 0.885, 0.32, 1.275]

// Common animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 }
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

export const slideInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 }
}

export const slideInDown: Variants = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 30 }
}

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 }
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 }
}

// Stagger animations
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2, ease: smoothEase }
}

export const hoverLift = {
  y: -5,
  scale: 1.02,
  transition: { duration: 0.2, ease: smoothEase }
}

export const hoverRotate = {
  rotate: 5,
  scale: 1.1,
  transition: { duration: 0.2, ease: smoothEase }
}

// Button animations
export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 }
}

export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2, ease: smoothEase }
}

// Loading animations
export const spin = {
  rotate: 360,
  transition: { duration: 1, repeat: Infinity, ease: "linear" }
}

export const pulse = {
  scale: [1, 1.1, 1],
  opacity: [0.5, 1, 0.5],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

export const bounce = {
  y: [0, -10, 0],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

// Page transition animations
export const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: smoothEase }
}

export const modalTransition = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { duration: 0.2, ease: smoothEase }
}

// Table row animations
export const tableRowAnimation = (index: number) => ({
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { 
    duration: 0.3, 
    delay: index * 0.05,
    ease: smoothEase
  }
})

// Card animations
export const cardAnimation = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { 
    duration: 0.4, 
    delay,
    ease: smoothEase
  }
})

// Form field animations
export const formFieldAnimation = (delay: number = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { 
    duration: 0.3, 
    delay,
    ease: smoothEase
  }
})

// Utility functions
export const createStaggerAnimation = (staggerDelay: number = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: staggerDelay
    }
  }
})

export const createDelayAnimation = (delay: number) => ({
  transition: { delay, ease: smoothEase }
})

// Animation presets for common use cases
export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: smoothEase }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: smoothEase }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.3, ease: smoothEase }
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    transition: { duration: 0.6, ease: bounceEase }
  }
} 