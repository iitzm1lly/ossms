"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  animated?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, animated = true, ...props }, ref) => {
    if (!animated) {
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
        className="relative"
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 focus:border-primary/50 focus:shadow-sm",
            className
          )}
          ref={ref}
          {...props}
        />
        <motion.div
          className="absolute inset-0 rounded-md border-2 border-transparent pointer-events-none"
          initial={{ scale: 0.95, opacity: 0 }}
          whileFocus={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
        />
      </motion.div>
    )
  }
)
Input.displayName = "Input"

export { Input }
