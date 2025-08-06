"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCategoryOptions, getSubcategoryLabel } from "@/lib/category-utils"
import { getVariationLabel } from "@/lib/variation-utils"
import { getStockStatusColors } from "@/lib/utils"

// Define Item interface locally to avoid mock-store conflicts
interface Item {
  id: number
  name: string
  unit_type: string
  bulk_quantity: number
  pieces_quantity: number
  pieces: number
  created_at: string
  updated_at: string
  low_threshold_bulk: number
  low_threshold_pcs: number
  moderate_threshold_bulk: number
  moderate_threshold_pcs: number
  high_threshold_bulk: number
  high_threshold_pcs: number
  stock_status: string
  status?: string
  description?: string
  category?: string
  subcategory?: string
  variation?: string
  brand?: string
  supplier_name?: string
  supplier_contact?: string
  supplier_notes?: string
  pieces_per_bulk?: number
  unit?: string
}

interface ItemDetailsProps {
  item: Item
}

export function ItemDetails({ item }: ItemDetailsProps) {
  const [categoryLabel, setCategoryLabel] = useState<string>("")
  const [subcategoryLabel, setSubcategoryLabel] = useState<string>("")

  useEffect(() => {
    // Get category and subcategory labels
    if (item.category) {
      const { categories, subcategories } = getCategoryOptions()

      // Find category label
      const categoryObj = categories.find((cat) => cat.value === item.category)
      setCategoryLabel(categoryObj?.label || item.category)

      // Find subcategory label
      if (item.subcategory) {
        setSubcategoryLabel(getSubcategoryLabel(item.category, item.subcategory))
      }
    }
  }, [item])

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                Item Information
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
                  <p className="text-lg font-semibold text-gray-900">{item.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                  <p className="text-base text-gray-800 leading-relaxed">
                    {item.description || "No description provided"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Category</p>
                  <p className="text-base font-semibold text-gray-900">{categoryLabel || "Uncategorized"}</p>
                </div>
                {subcategoryLabel && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Subcategory</p>
                    <p className="text-base font-semibold text-gray-900">{subcategoryLabel}</p>
                  </div>
                )}
                {item.variation && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Variation</p>
                    <p className="text-base font-semibold text-gray-900">{getVariationLabel(item.category || "", item.variation)}</p>
                  </div>
                )}
                {item.brand && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Brand</p>
                    <p className="text-base font-semibold text-gray-900">{item.brand}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                Stock Information
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Unit Type</p>
                  <p className="text-base font-semibold text-gray-900">{item.unit_type || item.unit || "Box"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Pieces per Bulk Unit</p>
                  <p className="text-base font-semibold text-gray-900">{item.pieces_per_bulk || 12}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Current Stock</p>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {item.pieces || item.pieces_quantity || 0} pieces (
                    {Math.floor((item.pieces || item.pieces_quantity || 0) / (item.pieces_per_bulk || 12))}{" "}
                    {item.unit_type || item.unit || "box"})
                  </p>
                  <div className="mt-2">
                    <Badge
                      className={`${getStockStatusColors(item.status || item.stock_status).bg} ${getStockStatusColors(item.status || item.stock_status).text} ${getStockStatusColors(item.status || item.stock_status).border} ${getStockStatusColors(item.status || item.stock_status).hover}`}
                    >
                      {item.status || item.stock_status || "Unknown"}
                    </Badge>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Last Updated</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(item.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
              Supplier Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Supplier Name</p>
                <p className="text-base font-semibold text-gray-900">{item.supplier_name || "Not specified"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Supplier Contact</p>
                <p className="text-base font-semibold text-gray-900">{item.supplier_contact || "Not specified"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Supplier Notes</p>
                <p className="text-base text-gray-800 leading-relaxed">{item.supplier_notes || "No notes provided"}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

