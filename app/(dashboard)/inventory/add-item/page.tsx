"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, HelpCircle, Package, Plus, ArrowLeft, Save, RotateCcw, Shield, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ApiErrorAlert } from "@/components/ui/api-error-alert"
import tauriApiService from "@/components/services/tauriApiService"
import { getCurrentUser, hasPermission } from "@/lib/permissions"

// Define unit types
const unitTypes = [
  { value: "box", label: "Box" },
  { value: "ream", label: "Ream" },
  { value: "pack", label: "Pack" },
  { value: "set", label: "Set" },
  { value: "roll", label: "Roll" },
  { value: "bottle", label: "Bottle" },
  { value: "carton", label: "Carton" },
  { value: "bulk", label: "Bulk" },
  { value: "unit", label: "Unit" },
]

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
    'bulk': 12,       // Generic bulk unit
    'unit': 1,        // Individual unit
    'piece': 1,       // Individual piece
    'item': 1,        // Individual item
  }
  
  return defaultPiecesMap[unitTypeLower] || 12 // Default fallback
}

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

export default function AddItemPage() {
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    unitType: "box", // Default unit type
    piecesPerBulk: getDefaultPiecesPerBulk("box").toString(), // Default pieces per bulk unit
    description: "",
    category: "",
    subcategory: "",
    supplierName: "",
    supplierContact: "",
    supplierNotes: "",
  })
  const [errors, setErrors] = useState({
    itemName: "",
    quantity: "",
    unitType: "",
    piecesPerBulk: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Check permissions on component mount
  useEffect(() => {
    const user = getCurrentUser()
    const canCreate = hasPermission(user, 'supplies', 'create') || user?.role === 'admin' || user?.role === 'staff'
    
    if (!canCreate) {
      setHasAccess(false)
      toast({
        title: "Access Denied",
        description: "You don't have permission to create inventory items.",
        variant: "destructive",
      })
      router.push("/dashboard")
      return
    }
    
    setHasAccess(true)
  }, [router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Prevent negative values for numeric fields
    if (['quantity', 'piecesPerBulk'].includes(name)) {
      const numValue = parseInt(value)
      if (numValue < 0) {
        return // Don't update if negative
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Automatically update pieces per bulk when unit type changes
    if (name === "unitType") {
      const defaultPieces = getDefaultPiecesPerBulk(value)
      setFormData(prev => ({ ...prev, piecesPerBulk: defaultPieces.toString() }))
    }
    
    // Clear error when user makes a selection
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleReset = () => {
    setFormData({
      itemName: "",
      quantity: "",
      unitType: "box",
      piecesPerBulk: getDefaultPiecesPerBulk("box").toString(),
      description: "",
      category: "",
      subcategory: "",
      supplierName: "",
      supplierContact: "",
      supplierNotes: "",
    })
    setErrors({
      itemName: "",
      quantity: "",
      unitType: "",
      piecesPerBulk: ""
    })
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation
    const newErrors = {
      itemName: "",
      quantity: "",
      unitType: "",
      piecesPerBulk: ""
    }
    
    if (!formData.itemName.trim()) {
      newErrors.itemName = "Item name is required"
    }
    
    if (!formData.quantity.trim()) {
      newErrors.quantity = "Quantity is required"
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be a positive number"
    } else if (Number(formData.quantity) < 0) {
      newErrors.quantity = "Quantity cannot be negative"
    }
    
    if (!formData.piecesPerBulk.trim()) {
      newErrors.piecesPerBulk = "Pieces per bulk unit is required"
    } else if (isNaN(Number(formData.piecesPerBulk)) || Number(formData.piecesPerBulk) <= 0) {
      newErrors.piecesPerBulk = "Pieces per bulk unit must be a positive number"
    } else if (Number(formData.piecesPerBulk) < 0) {
      newErrors.piecesPerBulk = "Pieces per bulk unit cannot be negative"
    }
    
    if (!formData.unitType) {
      newErrors.unitType = "Unit type is required"
    }
    
    setErrors(newErrors)
    
    if (Object.values(newErrors).some(error => error)) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Calculate pieces based on quantity and pieces per bulk
      const pieces = Number(formData.quantity) * Number(formData.piecesPerBulk)
      
      const payload = {
        name: formData.itemName.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category || "other",
        subcategory: formData.subcategory || undefined,
        quantity: pieces,
        unit: formData.unitType,
        min_quantity: 10, // Default minimum quantity
        status: pieces > 50 ? "High" : pieces > 20 ? "Moderate" : "Low",
        location: "Main Storage",
        supplier: formData.supplierName.trim() || undefined,
        supplier_name: formData.supplierName.trim() || undefined,
        supplier_contact: formData.supplierContact.trim() || undefined,
        supplier_notes: formData.supplierNotes.trim() || undefined,
        cost: undefined,
        pieces_per_bulk: Number(formData.piecesPerBulk),
      }
      
      const response = await tauriApiService.createSupply(payload)
      
      if (response) {
        toast({
          title: "Success",
          description: "Item added successfully",
        })
        router.push("/inventory/view-items")
      } else {
        throw new Error("Failed to add item")
      }
    } catch (error: any) {
      setError(error.message || "Failed to add item")
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking permissions
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-6 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Permissions...</h2>
          <p className="text-gray-600">Verifying your access to this page</p>
        </div>
      </div>
    )
  }

  // Show access denied state
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-6 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to create inventory items.</p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-[#b12025] hover:bg-[#8a1a1f] text-white"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="bg-white/50 border-gray-200 hover:bg-white/80"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
            </div>
            <p className="text-gray-600">Create a new inventory item with detailed information</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Ready to Add</span>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Item Information
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="bg-white/50 border-gray-200 hover:bg-white/80"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName" className="text-sm font-medium text-gray-700">
                    Item Name *
                  </Label>
                  <Input
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    placeholder="Enter item name"
                    className={`mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      errors.itemName ? "border-red-300 focus:border-red-500" : ""
                    }`}
                  />
                  {errors.itemName && (
                    <p className="mt-1 text-sm text-red-600">{errors.itemName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                    Quantity (Bulk Units) *
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    className={`mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      errors.quantity ? "border-red-300 focus:border-red-500" : ""
                    }`}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="unitType" className="text-sm font-medium text-gray-700">
                    Unit Type *
                  </Label>
                  <Select value={formData.unitType} onValueChange={(value) => handleSelectChange("unitType", value)}>
                    <SelectTrigger className={`mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 ${
                      errors.unitType ? "border-red-300 focus:border-red-500" : ""
                    }`}>
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unitType && (
                    <p className="mt-1 text-sm text-red-600">{errors.unitType}</p>
                  )}
                </div>

                <div>
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
                    type="number"
                    min="0"
                    value={formData.piecesPerBulk}
                    onChange={handleChange}
                    placeholder="12"
                    className="mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  {errors.piecesPerBulk && (
                    <p className="mt-1 text-sm text-red-600">{errors.piecesPerBulk}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                    <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
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
                  <div>
                    <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
                      Subcategory
                    </Label>
                    <Select value={formData.subcategory} onValueChange={(value) => handleSelectChange("subcategory", value)}>
                      <SelectTrigger className="mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories[formData.category as keyof typeof subcategories]?.map((subcategory) => (
                          <SelectItem key={subcategory.value} value={subcategory.value}>
                            {subcategory.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter item description"
                    rows={3}
                    className="mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Supplier Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Supplier Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="supplierName" className="text-sm font-medium text-gray-700">
                    Supplier Name
                  </Label>
                  <Input
                    id="supplierName"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleChange}
                    placeholder="Enter supplier name"
                    className="mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label htmlFor="supplierContact" className="text-sm font-medium text-gray-700">
                    Supplier Contact
                  </Label>
                  <Input
                    id="supplierContact"
                    name="supplierContact"
                    value={formData.supplierContact}
                    onChange={handleChange}
                    placeholder="Enter contact information"
                    className="mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label htmlFor="supplierNotes" className="text-sm font-medium text-gray-700">
                    Supplier Notes
                  </Label>
                  <Input
                    id="supplierNotes"
                    name="supplierNotes"
                    value={formData.supplierNotes}
                    onChange={handleChange}
                    placeholder="Enter additional notes"
                    className="mt-1 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {formData.quantity && formData.piecesPerBulk && (
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bulk Units:</span>
                    <span className="ml-2 font-medium text-gray-900">{formData.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Pieces:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {Number(formData.quantity) * Number(formData.piecesPerBulk)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && <ApiErrorAlert error={error} />}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/inventory/view-items")}
                className="bg-white/50 border-gray-200 hover:bg-white/80"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#b12025] hover:bg-[#8a1a1f] text-white flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Adding Item..." : "Add Item"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

