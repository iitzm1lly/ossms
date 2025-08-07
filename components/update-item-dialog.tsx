"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, HelpCircle, Package, TrendingUp, TrendingDown, Save, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import tauriApiService from "./services/tauriApiService"
import { getVariationOptions } from "@/lib/variation-utils"
import { calculateStockStatus } from "@/lib/utils"

// Define categories
const categories = [
  { value: "writing", label: "Writing Instruments" },
  { value: "paper", label: "Paper Products" },
  { value: "filing", label: "Filing & Storage" },
  { value: "desk", label: "Desk Accessories" },
  { value: "tech", label: "Technology" },
  { value: "other", label: "Other" },
]

// Define subcategories based on parent category
const subcategories = {
  writing: [
    { value: "pens", label: "Pens" },
    { value: "pencils", label: "Pencils" },
    { value: "markers", label: "Markers" },
    { value: "highlighters", label: "Highlighters" },
  ],
  paper: [
    { value: "bond_paper", label: "Bond Paper" },
    { value: "notebooks", label: "Notebooks" },
    { value: "sticky_notes", label: "Sticky Notes" },
    { value: "specialty_paper", label: "Specialty Paper" },
  ],
  filing: [
    { value: "folders", label: "Folders" },
    { value: "binders", label: "Binders" },
    { value: "clips", label: "Clips & Fasteners" },
    { value: "storage_boxes", label: "Storage Boxes" },
  ],
  desk: [
    { value: "staplers", label: "Staplers" },
    { value: "tape", label: "Tape & Adhesives" },
    { value: "scissors", label: "Scissors" },
    { value: "organizers", label: "Desk Organizers" },
  ],
  tech: [
    { value: "usb_drives", label: "USB Drives" },
    { value: "cables", label: "Cables" },
    { value: "peripherals", label: "Computer Peripherals" },
    { value: "batteries", label: "Batteries" },
  ],
  other: [
    { value: "cleaning", label: "Cleaning Supplies" },
    { value: "misc", label: "Miscellaneous" },
  ],
}

// Define Item interface locally to avoid mock-store conflicts
interface Item {
  id: number
  originalId: string // UUID from database for API calls
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

interface UpdateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
  onSuccess?: () => void
}

// Helper function to get default pieces per bulk unit based on unit type
const getDefaultPiecesPerBulk = (unitType: string): number => {
  const unitTypeLower = unitType?.toLowerCase() || 'box'
  
  const defaultPiecesMap: Record<string, number> = {
    'box': 12,        // Standard box of pens, paper clips, etc.
    'pack': 10,       // Pack of markers, highlighters, etc.
    'ream': 500,      // Ream of paper (500 sheets)
    'set': 5,         // Set of items (staplers, scissors, etc.)
    'roll': 1,        // Roll of tape, paper towels, etc.
    'bottle': 1,      // Bottle of ink, cleaning supplies, etc.
    'carton': 24,     // Carton of items (larger than box)
    'unit': 1,        // Individual unit
    'piece': 1,       // Individual piece
    'item': 1,        // Individual item
  }
  
  return defaultPiecesMap[unitTypeLower] || 12 // Default fallback
}

export function UpdateItemDialog({ open, onOpenChange, item, onSuccess }: UpdateItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [formData, setFormData] = useState({
    addBulk: "",
    addPieces: "",
    releaseBulk: "",
    releasePieces: "",
    stockInReason: "",
    stockOutReason: "",
    description: item.description || "",
    category: item.category || "",
    subcategory: item.subcategory || "",
    variation: item.variation || "",
    brand: item.brand || "",
    supplierName: item.supplier_name || "",
    supplierContact: item.supplier_contact || "",
    supplierNotes: item.supplier_notes || "",
    piecesPerBulk: item.pieces_per_bulk?.toString() || getDefaultPiecesPerBulk(item.unit_type || item.unit || "box").toString(),
  })
  const { toast } = useToast()

  useEffect(() => {
    // Update form data when item changes
    const unitType = item.unit_type || item.unit || "box"
    const defaultPiecesPerBulk = getDefaultPiecesPerBulk(unitType)
    
    setFormData((prev) => ({
      ...prev,
      description: item.description || "",
      category: item.category || "",
      subcategory: item.subcategory || "",
      variation: item.variation || "",
      brand: item.brand || "",
      supplierName: item.supplier_name || "",
      supplierContact: item.supplier_contact || "",
      supplierNotes: item.supplier_notes || "",
      piecesPerBulk: item.pieces_per_bulk?.toString() || defaultPiecesPerBulk.toString(),
    }))
  }, [item])

  // Helper function to get the item name regardless of the column name used
  const getItemName = (item: Item): string => {
    return item.name || "Unnamed Item"
  }

  // Helper function to format unit type for display
  const formatUnitType = (unitType: string): string => {
    if (!unitType) return "Box"
    return unitType.charAt(0).toUpperCase() + unitType.slice(1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Prevent negative values for numeric fields
    if (['addBulk', 'addPieces', 'releaseBulk', 'releasePieces', 'piecesPerBulk'].includes(name)) {
      const numValue = parseInt(value)
      if (numValue < 0) {
        return // Don't update if negative
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Reset subcategory when category changes
    if (name === "category") {
      setFormData((prev) => ({ ...prev, subcategory: "" }))
    }
  }

  const handleReset = () => {
    const unitType = item.unit_type || item.unit || "box"
    const defaultPiecesPerBulk = getDefaultPiecesPerBulk(unitType)
    
    setFormData({
      addBulk: "",
      addPieces: "",
      releaseBulk: "",
      releasePieces: "",
      stockInReason: "",
      stockOutReason: "",
      description: item.description || "",
      category: item.category || "",
      subcategory: item.subcategory || "",
      supplierName: item.supplier_name || "",
      supplierContact: item.supplier_contact || "",
      supplierNotes: item.supplier_notes || "",
      piecesPerBulk: item.pieces_per_bulk?.toString() || defaultPiecesPerBulk.toString(),
    })
    setError(null)
    setValidationErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const errors: { [key: string]: string } = {}
    
    // Validate brand field
    if (!formData.brand || formData.brand.trim() === "") {
      errors.brand = "Brand name is required"
    }
    
    // Validate stock adjustment fields
    const addBulk = Number.parseInt(formData.addBulk) || 0
    const addPieces = Number.parseInt(formData.addPieces) || 0
    const releaseBulk = Number.parseInt(formData.releaseBulk) || 0
    const releasePieces = Number.parseInt(formData.releasePieces) || 0
    
    if (addBulk < 0 || addPieces < 0 || releaseBulk < 0 || releasePieces < 0) {
      errors.stockAdjustment = "Stock adjustments cannot be negative"
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setIsSubmitting(true)
    setValidationErrors({})
    
    try {
      // Calculate new quantity
      const currentQuantity = item.pieces || item.pieces_quantity || 0
      const piecesPerBulk = Number.parseInt(formData.piecesPerBulk) || 12
      const addBulkPieces = addBulk * piecesPerBulk
      const releaseBulkPieces = releaseBulk * piecesPerBulk
      const totalAddPieces = addBulkPieces + addPieces
      const totalReleasePieces = releaseBulkPieces + releasePieces
      const quantityChange = totalAddPieces - totalReleasePieces
      const newQuantity = currentQuantity + quantityChange
      
      const supplyId = item.originalId || item.id.toString()
      // Calculate new status based on updated quantity
      const minQuantity = item.low_threshold_bulk || item.low_threshold_pcs || 10
      const newStatus = calculateStockStatus(newQuantity, minQuantity).status
      
      const supplyData = {
        name: item.name, // Use original item name
        description: formData.description || item.description || null,
        category: formData.category || item.category || null,
        subcategory: formData.subcategory || item.subcategory || null,
        variation: formData.variation || item.variation || null,
        brand: formData.brand || item.brand || null,
        quantity: newQuantity,
        unit: item.unit_type || item.unit || "box",
        min_quantity: minQuantity,
        status: newStatus,
        supplier_name: formData.supplierName || item.supplier_name || null,
        supplier_contact: formData.supplierContact || item.supplier_contact || null,
        supplier_notes: formData.supplierNotes || item.supplier_notes || null,
        pieces_per_bulk: Number.parseInt(formData.piecesPerBulk) || item.pieces_per_bulk || 12,
        stock_in_reason: formData.stockInReason || null,
        stock_out_reason: formData.stockOutReason || null
      }
      
      await tauriApiService.updateSupply(supplyId, supplyData)
      
      toast({
        title: "Success!",
        description: "Item updated successfully",
      })
      
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate preview values
  const currentQuantity = item.pieces || item.pieces_quantity || 0
  const piecesPerBulk = Number.parseInt(formData.piecesPerBulk) || 12
  const addBulk = Number.parseInt(formData.addBulk) || 0
  const addPieces = Number.parseInt(formData.addPieces) || 0
  const releaseBulk = Number.parseInt(formData.releaseBulk) || 0
  const releasePieces = Number.parseInt(formData.releasePieces) || 0
  
  // Convert bulk units to pieces and calculate total change
  const addBulkPieces = addBulk * piecesPerBulk
  const releaseBulkPieces = releaseBulk * piecesPerBulk
  const totalAddPieces = addBulkPieces + addPieces
  const totalReleasePieces = releaseBulkPieces + releasePieces
  const quantityChange = totalAddPieces - totalReleasePieces
  const newQuantity = currentQuantity + quantityChange

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8]">
        <DialogHeader className="bg-gradient-to-r from-[#b12025] to-[#8a1a1f] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6" />
              <DialogTitle className="text-xl font-bold">Update Item</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-white/90">
            Modify stock levels and item information for {getItemName(item)}
          </DialogDescription>
          <div className="flex items-center justify-end mt-2">
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Ready to Update</span>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Item Overview Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center text-gray-900">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Item Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-600 mb-1">Item Name</Label>
                  <p className="text-lg font-semibold text-gray-900">{getItemName(item)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-600 mb-1">Current Status</Label>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {item.status || "Unknown"}
                  </p>
                  <div className="mt-2">
                    <Badge
                      className={
                        item.status === "Low"
                          ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                          : item.status === "Moderate"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
                            : "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                      }
                    >
                      {item.status || "Unknown"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Actual: {currentQuantity <= item.low_threshold_pcs ? "Low" : currentQuantity <= item.moderate_threshold_pcs ? "Moderate" : "High"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-600 mb-1">Current Quantity</Label>
                  <p className="text-lg font-semibold text-gray-900">{currentQuantity} pieces</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-600 mb-1">Unit Type</Label>
                  <p className="text-lg font-semibold text-gray-900">{formatUnitType(item.unit_type || item.unit || "box")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="stock" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm">
                <TabsTrigger value="stock" className="data-[state=active]:bg-[#b12025] data-[state=active]:text-white">
                  Stock Management
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-[#b12025] data-[state=active]:text-white">
                  Item Details
                </TabsTrigger>
                <TabsTrigger value="supplier" className="data-[state=active]:bg-[#b12025] data-[state=active]:text-white">
                  Supplier Info
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stock" className="space-y-6 pt-6">
                {/* Stock Management Section */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Stock Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pieces per Bulk Unit */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="piecesPerBulk" className="text-sm font-medium text-gray-700">
                          Pieces per Bulk Unit
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of individual pieces in one bulk unit (e.g., 12 pens per box)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="piecesPerBulk"
                        name="piecesPerBulk"
                        value={formData.piecesPerBulk}
                        onChange={handleChange}
                        type="number"
                        min="0"
                        placeholder="12"
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Quantity Inputs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Add Quantity */}
                      <Card className="bg-green-50/50 border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center text-green-700">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Add Stock
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Bulk Units</Label>
                              <Input
                                type="number"
                                name="addBulk"
                                value={formData.addBulk}
                                onChange={handleChange}
                                min="0"
                                className="bg-white/50 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                                placeholder={`0 ${formatUnitType(item.unit_type || item.unit || "box")}`}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Pieces</Label>
                              <Input
                                type="number"
                                name="addPieces"
                                value={formData.addPieces}
                                onChange={handleChange}
                                min="0"
                                className="bg-white/50 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                                placeholder="0 pieces"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Reason</Label>
                            <Input
                              name="stockInReason"
                              value={formData.stockInReason}
                              onChange={handleChange}
                              placeholder="Enter reason for stock in"
                              className="bg-white/50 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Release Quantity */}
                      <Card className="bg-red-50/50 border-red-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center text-red-700">
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Release Stock
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Bulk Units</Label>
                              <Input
                                type="number"
                                name="releaseBulk"
                                value={formData.releaseBulk}
                                onChange={handleChange}
                                min="0"
                                className="bg-white/50 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                                placeholder={`0 ${formatUnitType(item.unit_type || item.unit || "box")}`}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Pieces</Label>
                              <Input
                                type="number"
                                name="releasePieces"
                                value={formData.releasePieces}
                                onChange={handleChange}
                                min="0"
                                className="bg-white/50 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                                placeholder="0 pieces"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Reason</Label>
                            <Input
                              name="stockOutReason"
                              value={formData.stockOutReason}
                              onChange={handleChange}
                              placeholder="Enter reason for stock out"
                              className="bg-white/50 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Transaction Preview */}
                    <Card className="bg-blue-50/50 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center text-blue-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Transaction Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-gray-600">Current</p>
                            <p className="text-lg font-bold text-gray-900">{currentQuantity} pieces</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-600">Change</p>
                            <p
                              className={`text-lg font-bold ${
                                quantityChange > 0
                                  ? "text-green-600"
                                  : quantityChange < 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {quantityChange > 0 ? "+" : ""}
                              {quantityChange} pieces
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-600">New Total</p>
                            <p className="text-lg font-bold text-gray-900">{newQuantity} pieces</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-6 pt-6">
                {/* Item Details Section */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      Item Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Item Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter detailed description of the item"
                        rows={3}
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                          Category
                        </Label>
                        <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                          <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.category && (
                        <div className="space-y-2">
                          <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
                            Subcategory
                          </Label>
                          <Select
                            value={formData.subcategory}
                            onValueChange={(value) => handleSelectChange("subcategory", value)}
                          >
                            <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.category &&
                                subcategories[formData.category as keyof typeof subcategories]?.map((subcategory) => (
                                  <SelectItem key={subcategory.value} value={subcategory.value}>
                                    {subcategory.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {formData.category && (
                        <div className="space-y-2">
                          <Label htmlFor="variation" className="text-sm font-medium text-gray-700">
                            Variation
                          </Label>
                          <Select
                            value={formData.variation}
                            onValueChange={(value) => handleSelectChange("variation", value)}
                          >
                            <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                              <SelectValue placeholder="Select variation" />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.category &&
                                getVariationOptions(formData.category).map((variation) => (
                                  <SelectItem key={variation.value} value={variation.value}>
                                    {variation.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                          Brand *
                        </Label>
                        <Input
                          id="brand"
                          name="brand"
                          value={formData.brand}
                          onChange={handleChange}
                          placeholder="Enter brand name"
                          className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                            validationErrors.brand ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors.brand && (
                          <p className="text-sm text-red-600">{validationErrors.brand}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="supplier" className="space-y-6 pt-6">
                {/* Supplier Information Section */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Package className="h-5 w-5 mr-2 text-green-600" />
                      Supplier Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="supplierName" className="text-sm font-medium text-gray-700">
                          Supplier Name
                        </Label>
                        <Input
                          id="supplierName"
                          name="supplierName"
                          value={formData.supplierName}
                          onChange={handleChange}
                          placeholder="Enter supplier name"
                          className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplierContact" className="text-sm font-medium text-gray-700">
                          Supplier Contact
                        </Label>
                        <Input
                          id="supplierContact"
                          name="supplierContact"
                          value={formData.supplierContact}
                          onChange={handleChange}
                          placeholder="Enter contact information"
                          className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplierNotes" className="text-sm font-medium text-gray-700">
                          Supplier Notes
                        </Label>
                        <Input
                          id="supplierNotes"
                          name="supplierNotes"
                          value={formData.supplierNotes}
                          onChange={handleChange}
                          placeholder="Enter additional notes"
                          className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleReset()
                  onOpenChange(false)
                }}
                className="bg-white/50 border-gray-200 hover:bg-white/80"
                disabled={isSubmitting}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#b12025] hover:bg-[#8a1a1f] text-white flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

