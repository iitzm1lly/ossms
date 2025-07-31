"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import tauriApiService from "@/components/services/tauriApiService"

interface Item {
  id: number
  originalId: string // UUID from database for API calls
  name: string
  category?: string
  unit_type?: string
  unit?: string
  pieces?: number
  quantity?: number
  stock_status?: string
  status?: string
  supplier_name?: string
  supplier?: string
}

// Helper function to convert Supply to Item
const convertSupplyToItem = (supply: any, index: number): Item => {
  // Use the original supply ID (UUID) for database operations, but create a numeric ID for React keys
  const originalId = supply.id // This is the UUID from the database
  const numericId = index + 1 // This is for React keys only
  
  return {
    id: numericId, // Use numeric ID for React keys to avoid duplicate key warnings
    originalId: originalId, // Store the original UUID for database operations
    name: supply.name,
    category: supply.category,
    unit_type: supply.unit,
    unit: supply.unit,
    pieces: supply.quantity,
    quantity: supply.quantity,
    stock_status: supply.status,
    status: supply.status,
    supplier_name: supply.supplier,
    supplier: supply.supplier,
  }
}

export const ItemsTable = () => {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await tauriApiService.getSupplies()
        if (response && Array.isArray(response)) {
          const convertedItems = response.map((supply, index) => convertSupplyToItem(supply, index))
          setItems(convertedItems)
        }
      } catch (error) {
        setItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Unit Type</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="border px-4 py-2">{item.name}</td>
                <td className="border px-4 py-2">{item.category}</td>
                <td className="border px-4 py-2">{item.unit_type || item.unit}</td>
                <td className="border px-4 py-2">{item.pieces || item.quantity}</td>
                <td className="border px-4 py-2">{item.stock_status || item.status}</td>
                <td className="border px-4 py-2">{item.supplier_name || item.supplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

