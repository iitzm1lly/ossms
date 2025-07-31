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
import { AlertTriangle, Package, Plus, Search, Filter, Grid, List, Edit, Trash2, Eye, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import tauriApiService from "@/components/services/tauriApiService"
import { UpdateItemDialog } from "@/components/update-item-dialog"
import { ItemDetails } from "@/components/item-details"
import { getCurrentUser, hasPermission } from "@/lib/permissions"

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
  supplier_name?: string
  supplier_contact?: string
  supplier_notes?: string
  pieces_per_bulk?: number
  unit?: string
}

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

// Helper function to convert Supply to Item
const convertSupplyToItem = (supply: any, index: number): Item => {
  // Use the original supply ID (UUID) for database operations, but create a numeric ID for React keys
  const originalId = supply.id // This is the UUID from the database
  const numericId = index + 1 // This is for React keys only
  
  // Calculate status based on quantity vs thresholds
  const lowThreshold = supply.min_quantity
  const moderateThreshold = supply.min_quantity * 2
  const highThreshold = supply.min_quantity * 3
  
  let status = "High"
  if (supply.quantity <= lowThreshold) {
    status = "Low"
  } else if (supply.quantity <= moderateThreshold) {
    status = "Moderate"
  }
  
  return {
    id: numericId, // Use numeric ID for React keys to avoid duplicate key warnings
    originalId: originalId, // Store the original UUID for database operations
    name: supply.name,
    unit_type: supply.unit,
    bulk_quantity: Math.floor(supply.quantity / (supply.pieces_per_bulk || 12)),
    pieces_quantity: supply.quantity,
    pieces: supply.quantity,
    created_at: supply.created_at,
    updated_at: supply.updated_at,
    low_threshold_bulk: supply.min_quantity,
    low_threshold_pcs: supply.min_quantity,
    moderate_threshold_bulk: supply.min_quantity * 2,
    moderate_threshold_pcs: supply.min_quantity * 2,
    high_threshold_bulk: supply.min_quantity * 3,
    high_threshold_pcs: supply.min_quantity * 3,
    stock_status: status,
    status: status,
    description: supply.description,
    category: supply.category,
    subcategory: supply.subcategory,
    supplier_name: supply.supplier_name || supply.supplier,
    supplier_contact: supply.supplier_contact || "",
    supplier_notes: supply.supplier_notes || "",
    pieces_per_bulk: supply.pieces_per_bulk || 12,
    unit: supply.unit,
  }
}

export default function ViewItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSubcategory, setSelectedSubcategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [itemToView, setItemToView] = useState<Item | null>(null)
  const [userPermissions, setUserPermissions] = useState({
    canViewSupplies: false,
    canEditSupplies: false,
    canDeleteSupplies: false,
    canCreateSupplies: false,
  })

  // Load items on component mount
  useEffect(() => {
    loadItems()
  }, [])

  // Check user permissions on component mount
  useEffect(() => {
    const user = getCurrentUser()
    setUserPermissions({
      canViewSupplies: hasPermission(user, 'supplies', 'view') || user?.role === 'admin' || user?.role === 'staff' || user?.role === 'viewer',
      canEditSupplies: hasPermission(user, 'supplies', 'edit') || user?.role === 'admin' || user?.role === 'staff',
      canDeleteSupplies: hasPermission(user, 'supplies', 'delete') || user?.role === 'admin',
      canCreateSupplies: hasPermission(user, 'supplies', 'create') || user?.role === 'admin' || user?.role === 'staff',
    })
  }, [])

  // Reset subcategory when category changes
  useEffect(() => {
    if (!selectedCategory || selectedCategory === "all") {
      setSelectedSubcategory("all")
    }
  }, [selectedCategory])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedSupplier])

  // Reset to first page when view mode changes
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode])

  const loadItems = async () => {
    try {
      setLoading(true)
      const supplies = await tauriApiService.getSupplies()
      if (supplies && Array.isArray(supplies)) {
        const convertedItems = supplies.map((supply, index) => convertSupplyToItem(supply, index))
        setItems(convertedItems)
          } else {
        setItems([])
        }
      } catch (error) {
      console.error('Error loading items:', error)
      toast.error("Error loading items")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (item: Item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleEditItem = (item: Item) => {
    setSelectedItem(item)
    setUpdateDialogOpen(true)
  }

  const handleViewItem = (item: Item) => {
    setItemToView(item)
    setViewDetailsOpen(true)
  }

  const handleAddItem = () => {
    router.push("/inventory/add-item")
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await tauriApiService.deleteSupply(itemToDelete.originalId)
      toast.success("Item deleted successfully")
      setItems(items.filter(item => item.id !== itemToDelete.id))
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error("Error deleting item")
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(term)) ||
        (item.supplier_name && item.supplier_name.toLowerCase().includes(term))
      )
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Subcategory filter
    if (selectedSubcategory && selectedSubcategory !== 'all') {
      filtered = filtered.filter(item => item.subcategory === selectedSubcategory)
    }

    // Supplier filter
    if (selectedSupplier && selectedSupplier !== 'all') {
      filtered = filtered.filter(item => item.supplier_name === selectedSupplier)
    }

    return filtered
  }, [items, searchTerm, selectedCategory, selectedSubcategory, selectedSupplier])

  // Pagination logic - different items per page based on view mode
  const itemsPerPageForView = viewMode === "cards" ? 8 : 10
  const totalPages = Math.ceil(filteredItems.length / itemsPerPageForView)
  const startIndex = (currentPage - 1) * itemsPerPageForView
  const endIndex = startIndex + itemsPerPageForView
  const currentItems = filteredItems.slice(startIndex, endIndex)

  // Helper functions
  const getItemName = (item: Item): string => {
    return item.name || "Unnamed Item"
  }

  const formatUnitType = (unitType: string): string => {
    if (!unitType) return "Box"
    return unitType.charAt(0).toUpperCase() + unitType.slice(1)
  }

  const getCategoryLabel = (categoryValue: string | undefined): string => {
    if (!categoryValue) return "Unknown"
    const category = categories.find((c) => c.value === categoryValue)
    return category ? category.label : categoryValue
  }

  const getSubcategoryLabel = (categoryValue: string | undefined, subcategoryValue: string | undefined): string => {
    if (!categoryValue || !subcategoryValue) return subcategoryValue || "Unknown"

    const subcategoryList = subcategories[categoryValue as keyof typeof subcategories]
    if (!subcategoryList) return subcategoryValue

    const subcategory = subcategoryList.find((s) => s.value === subcategoryValue)
    return subcategory ? subcategory.label : subcategoryValue
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedSubcategory("all")
    setSelectedSupplier("all")
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "low":
        return "bg-red-100 text-red-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Stats Overview */}
       <motion.div 
         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
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
             <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
               <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
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
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.3}>
             <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
               <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Moderate Stock</p>
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
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.4}>
             <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
               <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                       {new Set(items.map(item => item.category).filter(Boolean)).size}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                     <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
               </CardContent>
             </Card>
        </AnimatedCard>
         </motion.div>

         <motion.div variants={staggerItem}>
        <AnimatedCard delay={0.5}>
             <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
               <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suppliers</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {new Set(items.map(item => item.supplier_name).filter(Boolean)).size}
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
       </motion.div>

      {/* Filters Section */}
      <SlideIn delay={0.6}>
        <Card className="mb-6 bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                  placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>

              {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
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
                    <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                      <SelectTrigger>
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
                  <span>Inventory Items ({filteredItems.length})</span>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Supplier</TableHead>
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
                        <TableCell className="font-medium">{getItemName(item)}</TableCell>
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
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
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
            <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Inventory Items ({filteredItems.length})</span>
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
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="bg-white bg-opacity-80 backdrop-blur-sm border-white border-opacity-20 h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{getItemName(item)}</CardTitle>
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(item.status || "")}>
                          {item.status || "Unknown"}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                  </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                      <div>
                          <p className="text-sm font-medium text-gray-600">Category</p>
                          <p className="text-sm">{getCategoryLabel(item.category || "")}</p>
                              {item.subcategory && (
                            <p className="text-xs text-gray-500">
                              {getSubcategoryLabel(item.category || "", item.subcategory)}
                            </p>
                          )}
                      </div>
                      <div>
                          <p className="text-sm font-medium text-gray-600">Stock</p>
                          <p className="text-sm">{item.bulk_quantity} {formatUnitType(item.unit_type)}</p>
                          <p className="text-xs text-gray-500">{item.pieces_quantity} pieces</p>
                      </div>
                      <div>
                          <p className="text-sm font-medium text-gray-600">Supplier</p>
                          <p className="text-sm">{item.supplier_name || "N/A"}</p>
                      </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm" 
                            variant="ghost" 
                            className="flex-1"
                            onClick={() => handleViewItem(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {userPermissions.canEditSupplies && (
                            <Button
                              size="sm"
                              variant="ghost" 
                              className="flex-1"
                              onClick={() => handleEditItem(item)}
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
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
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
              <div className="flex items-center justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
      </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">Delete Item</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Are you sure you want to delete <strong>"{itemToDelete?.name}"</strong>? 
              <br />
              This action cannot be undone and will permanently remove the item from your inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Item Dialog */}
      {selectedItem && (
        <UpdateItemDialog
          open={updateDialogOpen}
          onOpenChange={(open) => {
            setUpdateDialogOpen(open)
            if (!open) setSelectedItem(null)
          }}
          item={selectedItem}
          onSuccess={loadItems}
        />
      )}

      {/* View Item Details Sheet */}
      {itemToView && (
        <Sheet open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <SheetContent className="w-[500px] sm:w-[600px] bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 p-0">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Package className="h-6 w-6" />
                  <SheetTitle className="text-xl font-bold">Item Details</SheetTitle>
                </div>
                </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">
                  Detailed information about <strong className="text-yellow-200">{getItemName(itemToView)}</strong>
              </div>
                <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Data</span>
            </div>
                    </div>
                    </div>
            
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <ItemDetails item={itemToView} />
              
              {/* Action buttons at the bottom */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                    setViewDetailsOpen(false)
                    setTimeout(() => handleEditItem(itemToView), 100)
              }}
                  className="flex-1 sm:flex-none"
            >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
            </Button>
            <Button
                  variant="outline" 
                  onClick={() => setViewDetailsOpen(false)}
                  className="flex-1 sm:flex-none"
                >
                  Close
            </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

