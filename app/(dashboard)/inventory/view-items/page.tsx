"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, Package, Plus, Search, Filter, Grid, List, Edit, Trash2, Eye, ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Info, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import tauriApiService from "@/components/services/tauriApiService"
import { UpdateItemDialog } from "@/components/update-item-dialog"
import { ItemDetails } from "@/components/item-details"
import { getCurrentUser, hasPermission } from "@/lib/permissions"
import { calculateStockStatus, getStockStatusColors } from "@/lib/utils"

// Animation variants
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// Animated components
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
  >
    {children}
  </motion.div>
)

const AnimatedCard = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ scale: 1.02 }}
  >
    {children}
  </motion.div>
)

const SlideIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
  >
    {children}
  </motion.div>
)

// Interface for Item
interface Item {
  id: number
  originalId: string
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

// Sort type
type SortField = 'name' | 'category' | 'stock' | 'status' | 'supplier'
type SortDirection = 'asc' | 'desc'

// Categories and subcategories data - matching add-item page
const categories = [
  { value: "writing", label: "Writing Instruments" },
  { value: "paper", label: "Paper Products" },
  { value: "filing", label: "Filing & Storage" },
  { value: "desk", label: "Desk Accessories" },
  { value: "tech", label: "Technology" },
  { value: "other", label: "Other" },
]

const subcategories = {
  writing: [
    { value: "pens", label: "Pens" },
    { value: "pencils", label: "Pencils" },
    { value: "markers", label: "Markers" },
    { value: "highlighters", label: "Highlighters" },
  ],
  paper: [
    { value: "bond_paper", label: "Bond Paper" },
    { value: "specialty_paper", label: "Specialty Paper" },
    { value: "notebooks", label: "Notebooks" },
    { value: "sticky_notes", label: "Sticky Notes" },
  ],
  filing: [
    { value: "folders", label: "Folders" },
    { value: "binders", label: "Binders" },
    { value: "clips", label: "Clips" },
    { value: "storage_boxes", label: "Storage Boxes" },
  ],
  desk: [
    { value: "staplers", label: "Staplers" },
    { value: "tape", label: "Tape" },
    { value: "scissors", label: "Scissors" },
    { value: "organizers", label: "Organizers" },
  ],
  tech: [
    { value: "usb_drives", label: "USB Drives" },
    { value: "batteries", label: "Batteries" },
    { value: "cables", label: "Cables" },
    { value: "peripherals", label: "Peripherals" },
  ],
  other: [
    { value: "cleaning", label: "Cleaning" },
    { value: "misc", label: "Miscellaneous" },
  ],
}

const convertSupplyToItem = (supply: any, index: number): Item => {
  const quantity = supply.quantity || 0
  const min_quantity = supply.min_quantity || 10 // Default to 10 if not set
  const pieces_per_bulk = supply.pieces_per_bulk || 1
  
  // Calculate bulk and pieces quantities
  const bulk_quantity = Math.floor(quantity / pieces_per_bulk)
  const pieces_quantity = quantity % pieces_per_bulk
  
  // Use consistent stock status calculation
  const stockStatus = calculateStockStatus(quantity, min_quantity)
  
  return {
    id: index + 1,
    originalId: supply.id,
    name: supply.name,
    unit_type: supply.unit,
    bulk_quantity,
    pieces_quantity,
    pieces: quantity,
    created_at: supply.created_at,
    updated_at: supply.updated_at,
    low_threshold_bulk: Math.floor(min_quantity / pieces_per_bulk),
    low_threshold_pcs: min_quantity % pieces_per_bulk,
    moderate_threshold_bulk: Math.floor((min_quantity * 1.5) / pieces_per_bulk),
    moderate_threshold_pcs: Math.floor((min_quantity * 1.5) % pieces_per_bulk),
    high_threshold_bulk: Math.floor((min_quantity * 2) / pieces_per_bulk),
    high_threshold_pcs: Math.floor((min_quantity * 2) % pieces_per_bulk),
    stock_status: supply.status,
    status: stockStatus.status,
    description: supply.description,
    category: supply.category,
    subcategory: supply.subcategory,
    variation: supply.variation,
    brand: supply.brand,
    supplier_name: supply.supplier_name,
    supplier_contact: supply.supplier_contact,
    supplier_notes: supply.supplier_notes,
    pieces_per_bulk,
    unit: supply.unit,
  }
}

export default function ViewItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [userPermissions, setUserPermissions] = useState({
    canViewSupplies: false,
    canCreateSupplies: false,
    canEditSupplies: false,
    canDeleteSupplies: false,
  })
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setUserPermissions({
            canViewSupplies: hasPermission(user, "supplies", "view"),
            canCreateSupplies: hasPermission(user, "supplies", "create"),
            canEditSupplies: hasPermission(user, "supplies", "edit"),
            canDeleteSupplies: hasPermission(user, "supplies", "delete"),
          })
        }
      } catch (error) {
        console.error("Error checking permissions:", error)
      }
    }
    
    checkPermissions()
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const supplies = await tauriApiService.getSupplies()
      const convertedItems = supplies.map((supply: any, index: number) => 
        convertSupplyToItem(supply, index)
      )
      setItems(convertedItems)
    } catch (error) {
      console.error("Error loading items:", error)
      toast.error("Failed to load inventory items")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (item: Item) => {
    setItemToDelete(item)
    setShowDeleteDialog(true)
  }

  const handleEditItem = (item: Item) => {
    setSelectedItem(item)
    setShowUpdateDialog(true)
  }

  const handleViewItem = (item: Item) => {
    setSelectedItem(item)
    setShowViewDialog(true)
  }

  const handleAddItem = () => {
    router.push("/inventory/add-item")
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await tauriApiService.deleteSupply(itemToDelete.originalId)
      toast.success("Item deleted successfully")
      setShowDeleteDialog(false)
      setItemToDelete(null)
      loadItems() // Reload the list
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  const handleUpdateSuccess = () => {
    setShowUpdateDialog(false)
    setSelectedItem(null)
    loadItems() // Reload the list
    toast.success("Item updated successfully")
  }

  const handleRecalculateStockStatus = async () => {
    try {
      await tauriApiService.recalculateStockStatus()
      toast.success("Stock status recalculated successfully")
      loadItems() // Reload items to show updated statuses
    } catch (error: any) {
      toast.error(error.message || "Failed to recalculate stock status")
    }
  }

  // Sorting function
  const sortItems = (items: Item[], field: SortField, direction: SortDirection): Item[] => {
    return [...items].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (field) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'category':
          aValue = (a.category || '').toLowerCase()
          bValue = (b.category || '').toLowerCase()
          break
        case 'stock':
          aValue = a.pieces
          bValue = b.pieces
          break
        case 'status':
          // Custom sorting for status: High (3) > Moderate (2) > Low (1)
          const getStatusValue = (status: string) => {
            const statusLower = status.toLowerCase()
            if (statusLower === 'high') return 3
            if (statusLower === 'moderate') return 2
            if (statusLower === 'low') return 1
            return 0 // Unknown status
          }
          aValue = getStatusValue(a.status || '')
          bValue = getStatusValue(b.status || '')
          break
        case 'supplier':
          aValue = (a.supplier_name || '').toLowerCase()
          bValue = (b.supplier_name || '').toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchesSupplier = selectedSupplier === "all" || item.supplier_name === selectedSupplier
      
      return matchesSearch && matchesCategory && matchesSupplier
    })

    return sortItems(filtered, sortField, sortDirection)
  }, [items, searchTerm, selectedCategory, selectedSupplier, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredAndSortedItems.slice(startIndex, endIndex)

  const getItemName = (item: Item): string => {
    return item.name
  }

  const formatUnitType = (unitType: string): string => {
    return unitType.charAt(0).toUpperCase() + unitType.slice(1)
  }

  const getCategoryLabel = (categoryValue: string | undefined): string => {
    const category = categories.find(cat => cat.value === categoryValue)
    return category ? category.label : categoryValue || "Unknown"
  }

  const getSubcategoryLabel = (categoryValue: string | undefined, subcategoryValue: string | undefined): string => {
    if (!categoryValue || !subcategoryValue) return ""
    const categorySubcategories = subcategories[categoryValue as keyof typeof subcategories]
    const subcategory = categorySubcategories?.find(sub => sub.value === subcategoryValue)
    return subcategory ? subcategory.label : subcategoryValue
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedSupplier("all")
    setCurrentPage(1)
    setSortField('name')
    setSortDirection('asc')
  }

  const getStatusColor = (status: string) => {
    const colors = getStockStatusColors(status)
    return `${colors.bg} ${colors.text}`
  }

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 p-4">
      {/* Header Section */}
      <FadeIn>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
              <p className="text-gray-600">Manage and monitor your office supplies inventory</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-2 border border-white border-opacity-20 hover:scale-105 transition-transform duration-200">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <List className="h-4 w-4" />
                  <span>Table</span>
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <Grid className="h-4 w-4" />
                  <span>Cards</span>
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateStockStatus}
                className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recalculate Status</span>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Stats Overview */}
       <motion.div 
         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8"
         variants={staggerContainer}
         initial="initial"
         animate="animate"
       >
         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.1}>
             <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
               <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
               </CardContent>
             </Card>
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.2}>
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20 cursor-help">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="flex items-center gap-2">
                             <p className="text-sm font-medium text-gray-600">Low Stock</p>
                             <Info className="h-4 w-4 text-gray-400" />
                           </div>
                           <p className="text-2xl font-bold text-red-600">
                             {items.filter(item => item.status === "Low").length}
                           </p>
                         </div>
                         <div className="p-3 bg-red-100 rounded-xl">
                           <AlertTriangle className="h-6 w-6 text-red-600" />
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="max-w-xs">
                   <div className="space-y-2">
                     <p className="font-semibold">Low Stock Threshold</p>
                     <p className="text-sm">Items with quantity ≤ 10 pieces</p>
                     <p className="text-xs text-gray-500">These items need immediate restocking</p>
                   </div>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.3}>
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20 cursor-help">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="flex items-center gap-2">
                             <p className="text-sm font-medium text-gray-600">Moderate Stock</p>
                             <Info className="h-4 w-4 text-gray-400" />
                           </div>
                           <p className="text-2xl font-bold text-yellow-600">
                             {items.filter(item => item.status === "Moderate").length}
                           </p>
                         </div>
                         <div className="p-3 bg-yellow-100 rounded-xl">
                           <AlertTriangle className="h-6 w-6 text-yellow-600" />
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="max-w-xs">
                   <div className="space-y-2">
                     <p className="font-semibold">Moderate Stock Threshold</p>
                     <p className="text-sm">Items with quantity 11-15 pieces</p>
                     <p className="text-xs text-gray-500">These items should be monitored for restocking</p>
                   </div>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.35}>
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20 cursor-help">
                     <CardContent className="p-6">
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="flex items-center gap-2">
                             <p className="text-sm font-medium text-gray-600">High Stock</p>
                             <Info className="h-4 w-4 text-gray-400" />
                           </div>
                           <p className="text-2xl font-bold text-green-600">
                             {items.filter(item => item.status === "High").length}
                           </p>
                         </div>
                         <div className="p-3 bg-green-100 rounded-xl">
                           <Package className="h-6 w-6 text-green-600" />
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="max-w-xs">
                   <div className="space-y-2">
                     <p className="font-semibold">High Stock Threshold</p>
                     <p className="text-sm">Items with quantity > 15 pieces</p>
                     <p className="text-xs text-gray-500">These items have adequate stock levels</p>
                   </div>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.4}>
             <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
               <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Array.from(new Set(items.map(item => item.category).filter(Boolean))).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
               </CardContent>
             </Card>
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.45}>
             <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
               <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suppliers</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {Array.from(new Set(items.map(item => item.supplier_name).filter(Boolean))).length}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
               </CardContent>
             </Card>
        </AnimatedCard>
         </motion.div>
       </motion.div>

      {/* Filters Section */}
      <SlideIn delay={0.2}>
        <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search items, brands, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Subcategory Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {selectedCategory !== "all" && subcategories[selectedCategory as keyof typeof subcategories]?.map((subcategory) => (
                    <SelectItem key={subcategory.value} value={subcategory.value}>
                      {subcategory.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Supplier Filter */}
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                  {Array.from(new Set(items.map(item => item.supplier_name).filter(Boolean))).map((supplier) => (
                    <SelectItem key={supplier!} value={supplier!}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

              {/* Reset Filters */}
                  <Button 
                    variant="outline" 
            onClick={resetFilters}
                className="flex items-center space-x-2"
          >
                <Filter className="h-4 w-4" />
                <span>Reset</span>
          </Button>
        </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Items Display */}
      <AnimatePresence mode="wait">
            {viewMode === "table" ? (
          <motion.div
                key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Inventory Items ({filteredAndSortedItems.length})</span>
                  {userPermissions.canCreateSupplies && (
                    <Button 
                      className="flex items-center space-x-2"
                      onClick={handleAddItem}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Item</span>
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('name')}
                          className="flex items-center space-x-1 p-0 h-auto font-semibold"
                        >
                          <span>Name</span>
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('category')}
                          className="flex items-center space-x-1 p-0 h-auto font-semibold"
                        >
                          <span>Category</span>
                          {getSortIcon('category')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('stock')}
                          className="flex items-center space-x-1 p-0 h-auto font-semibold"
                        >
                          <span>Stock</span>
                          {getSortIcon('stock')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('status')}
                          className="flex items-center space-x-1 p-0 h-auto font-semibold"
                        >
                          <span>Status</span>
                          {getSortIcon('status')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('supplier')}
                          className="flex items-center space-x-1 p-0 h-auto font-semibold"
                        >
                          <span>Supplier</span>
                          {getSortIcon('supplier')}
                        </Button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((item, index) => (
                      <motion.tr
                          key={item.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{getItemName(item)}</div>
                            {item.brand && (
                              <div className="text-sm text-gray-500 font-medium">
                                {item.brand}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{getCategoryLabel(item.category || "")}</div>
                            {item.subcategory && (
                              <div className="text-sm text-gray-500">
                                {getSubcategoryLabel(item.category || "", item.subcategory)}
                          </div>
                                  )}
                                </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.bulk_quantity} {formatUnitType(item.unit_type)}</div>
                            <div className="text-sm text-gray-500">{item.pieces_quantity} pieces</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status || "")}>
                            {item.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.supplier_name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                              <Button
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewItem(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {userPermissions.canEditSupplies && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {userPermissions.canDeleteSupplies && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteItem(item)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} items
                    </div>
                    <div className="flex items-center space-x-2">
                              <Button
                        variant="outline"
                                size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                              </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                            >
                        Next
                        <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
                key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20 hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{getItemName(item)}</CardTitle>
                          {item.brand && (
                            <p className="text-sm text-gray-500 font-medium mt-1">
                              {item.brand}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(item.status || "")}>
                          {item.status || "Unknown"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Category</p>
                          <p className="text-sm text-gray-900">{getCategoryLabel(item.category || "")}</p>
                          {item.subcategory && (
                            <p className="text-xs text-gray-500 mt-1">
                              {getSubcategoryLabel(item.category || "", item.subcategory)}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Stock</p>
                          <p className="text-sm text-gray-900">
                            {item.bulk_quantity} {formatUnitType(item.unit_type)} ({item.pieces_quantity} pieces)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Supplier</p>
                          <p className="text-sm text-gray-900">{item.supplier_name || "N/A"}</p>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleViewItem(item)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {userPermissions.canEditSupplies && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditItem(item)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {userPermissions.canDeleteSupplies && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteItem(item)}
                              className="text-red-600 hover:text-red-700 flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination for Cards */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} items
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      {showUpdateDialog && selectedItem && (
        <UpdateItemDialog
          item={selectedItem}
          onClose={() => setShowUpdateDialog(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {showViewDialog && selectedItem && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Item Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected item
              </DialogDescription>
            </DialogHeader>
            <ItemDetails item={selectedItem} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

