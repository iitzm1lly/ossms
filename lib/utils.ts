import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate stock status based on quantity and minimum quantity thresholds
 * 
 * Stock Status Thresholds (based on min_quantity = 10):
 * - Low: ≤ 10 pieces (immediate restocking needed)
 * - Moderate: 11-15 pieces (monitor for restocking)
 * - High: > 15 pieces (adequate stock levels)
 * 
 * @param quantity - Current stock quantity in pieces
 * @param minQuantity - Minimum quantity threshold (default: 10)
 * @returns Object containing status and threshold information
 * 
 * @example
 * ```typescript
 * const status = calculateStockStatus(8, 10)
 * // Returns: { status: 'Low', thresholds: { low: 10, moderate: 15, high: 20 }, ... }
 * 
 * const status = calculateStockStatus(12, 10)
 * // Returns: { status: 'Moderate', thresholds: { low: 10, moderate: 15, high: 20 }, ... }
 * 
 * const status = calculateStockStatus(18, 10)
 * // Returns: { status: 'High', thresholds: { low: 10, moderate: 15, high: 20 }, ... }
 * ```
 */
export function calculateStockStatus(quantity: number, minQuantity: number = 10) {
  const moderateThreshold = Math.floor(minQuantity * 1.5)
  const highThreshold = minQuantity * 2

  let status: 'Low' | 'Moderate' | 'High' = 'High'
  
  if (quantity <= minQuantity) {
    status = 'Low'
  } else if (quantity <= moderateThreshold) {
    status = 'Moderate'
  }

  return {
    status,
    thresholds: {
      low: minQuantity,
      moderate: moderateThreshold,
      high: highThreshold
    },
    description: {
      low: `≤ ${minQuantity} pieces`,
      moderate: `${minQuantity + 1} - ${moderateThreshold} pieces`,
      high: `> ${moderateThreshold} pieces`
    }
  }
}

/**
 * Get stock status color classes for consistent styling across the application
 * 
 * @param status - Stock status ('Low', 'Moderate', 'High', or any other value)
 * @returns Object with Tailwind CSS classes for background, text, border, and hover states
 * 
 * @example
 * ```typescript
 * const colors = getStockStatusColors('Low')
 * // Returns: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', hover: 'hover:bg-red-200' }
 * ```
 */
export function getStockStatusColors(status: string) {
  switch (status?.toLowerCase()) {
    case "low":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        hover: "hover:bg-red-200"
      }
    case "moderate":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-800", 
        border: "border-yellow-200",
        hover: "hover:bg-yellow-200"
      }
    case "high":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200", 
        hover: "hover:bg-green-200"
      }
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
        hover: "hover:bg-gray-200"
      }
  }
}
