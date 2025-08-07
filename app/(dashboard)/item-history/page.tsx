"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Loader2, Info, Filter, ArrowUpDown, ArrowUp, ArrowDown, FileText, TrendingUp, TrendingDown, Calendar, User, Package, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import tauriApiService from "@/components/services/tauriApiService"
import { getCurrentUser, hasPermission } from "@/lib/permissions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

type ItemHistory = {
  id: string;
  name?: string;
  item_name?: string;
  pieces?: number;
  quantity?: number;
  quantity_before?: number;
  quantity_after?: number;
  before_qty?: number;
  after_qty?: number;
  performed_by?: string;
  releaser?: string; // For backward compatibility
  releaser_name?: string; // For backward compatibility
  created_at: string;
  reason?: string;
  action?: string;
};

// Helper function to convert EnrichedSupplyHistory to ItemHistory
const convertSupplyHistoryToItemHistory = (history: any, index: number): ItemHistory => {
  // Use a simple unique ID based on index
  const uniqueId = `history-${index}`
  
  return {
    id: uniqueId,
    name: history.supply_name,
    item_name: history.supply_name,
    pieces: history.quantity,
    quantity: history.quantity,
    quantity_before: history.previous_quantity,
    quantity_after: history.new_quantity,
    before_qty: history.previous_quantity,
    after_qty: history.new_quantity,
    performed_by: history.user_name,
    releaser: history.user_name,
    releaser_name: history.user_name,
    created_at: history.created_at,
    reason: history.notes || "",
    action: history.action,
  }
}

export default function ItemHistoryPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [historyData, setHistoryData] = useState<ItemHistory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [stockInFilter, setStockInFilter] = useState(false)
  const [stockOutFilter, setStockOutFilter] = useState(false)
  const [itemUpdatedFilter, setItemUpdatedFilter] = useState(false)
  const [selectedItem, setSelectedItem] = useState("all")
  const [selectedPerformedBy, setSelectedPerformedBy] = useState("all")
  const [selectedDateRange, setSelectedDateRange] = useState("all")
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [items, setItems] = useState<string[]>([])
  const [performedByUsers, setPerformedByUsers] = useState<string[]>([])
  const [itemToDelete, setItemToDelete] = useState<ItemHistory | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isFilterOpen) {
      // Filter sheet opened
    }
  }, [isFilterOpen])

  useEffect(() => {
    if (sortConfig && sortConfig.key && sortConfig.direction) {
      // Sort config changed
    }
  }, [sortConfig])

  const getSupplyHistories = async () => {
    try {
      setIsLoading(true)
      const res = await tauriApiService.getSupplyHistories()
      
      if (res && Array.isArray(res)) {
        const converted = res.map((item: any) => ({
          id: item.id,
          name: item.supply_name || 'Unknown Item',
          action: item.action,
          quantity: item.quantity,
          previousQuantity: item.previous_quantity,
          newQuantity: item.new_quantity,
          // Add the field names that the table expects
          before_qty: item.previous_quantity,
          after_qty: item.new_quantity,
          quantity_before: item.previous_quantity,
          quantity_after: item.new_quantity,
          notes: item.notes,
          reason: item.notes, // Map notes to reason field
          userId: item.user_id,
          performed_by: item.user_name || 'Unknown User',
          created_at: item.created_at
        }))
        return converted
      } else {
        return []
      }
    } catch (error) {
      return []
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true)
        const data = await getSupplyHistories()
        
        // Ensure we always store an array to avoid runtime errors
        setHistoryData(Array.isArray(data) ? data : [])

        if (Array.isArray(data) && data.length > 0) {
          // Extract unique items
          const uniqueItems = Array.from(
            new Set(
              data
                .filter((item: any) => item.name)
                .map((item: any) => item.name),
            ),
          )
          setItems(uniqueItems as string[])

          // Extract unique performed by users
          const uniquePerformedByUsers = Array.from(
            new Set(
              data
                .filter((item: any) => item.performed_by)
                .map((item: any) => item.performed_by),
            ),
          )
          setPerformedByUsers(uniquePerformedByUsers as string[])
          
        } else {
          setItems([])
          setPerformedByUsers([])
        }
      } catch (error) {
        toast({
          title: "Error loading item history",
          description: "There was a problem loading the item history.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [toast])

  // Filter and sort data
  const processedData = useMemo(() => {
    
    let filtered = Array.isArray(historyData) ? [...historyData] : []

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.performed_by || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reason || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply action filters
    if (stockInFilter && !stockOutFilter && !itemUpdatedFilter) {
      filtered = filtered.filter((item) => item.action === "Stock In")
    } else if (stockOutFilter && !stockInFilter && !itemUpdatedFilter) {
      filtered = filtered.filter((item) => item.action === "Stock Out")
    } else if (itemUpdatedFilter && !stockInFilter && !stockOutFilter) {
      filtered = filtered.filter((item) => item.action === "Item Updated")
    } else if (stockInFilter && stockOutFilter && !itemUpdatedFilter) {
      filtered = filtered.filter((item) => item.action === "Stock In" || item.action === "Stock Out")
    } else if (stockInFilter && itemUpdatedFilter && !stockOutFilter) {
      filtered = filtered.filter((item) => item.action === "Stock In" || item.action === "Item Updated")
    } else if (stockOutFilter && itemUpdatedFilter && !stockInFilter) {
      filtered = filtered.filter((item) => item.action === "Stock Out" || item.action === "Item Updated")
    } else if (stockInFilter && stockOutFilter && itemUpdatedFilter) {
      // Show all three, no additional filtering needed
    } else if (!stockInFilter && !stockOutFilter && !itemUpdatedFilter) {
      // Show all when no filters are applied
      // No filtering needed - show everything
    }

    // Apply item filter
    if (selectedItem !== "all") {
      filtered = filtered.filter((item) => item.name === selectedItem)
    }

    // Apply performed by filter
    if (selectedPerformedBy !== "all") {
      filtered = filtered.filter((item) => item.performed_by === selectedPerformedBy)
    }

    // Apply date range filter
    if (selectedDateRange !== "all" || customDateRange?.from || customDateRange?.to) {
      const now = new Date()
      let startDate: Date
      let endDate: Date

      if (customDateRange?.from && customDateRange?.to) {
        startDate = customDateRange.from
        endDate = customDateRange.to
      } else {
        switch (selectedDateRange) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
            break
          case "week":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
            endDate = now
            break
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
            endDate = now
            break
          default:
            startDate = new Date(0)
            endDate = now
        }
      }

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.created_at)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortConfig.key) {
          case "name":
            aValue = (a.name || "").toLowerCase()
            bValue = (b.name || "").toLowerCase()
            break
          case "performed_by":
            aValue = (a.performed_by || "").toLowerCase()
            bValue = (b.performed_by || "").toLowerCase()
            break
          case "action":
            aValue = (a.action || "").toLowerCase()
            bValue = (b.action || "").toLowerCase()
            break
          case "quantity":
            aValue = a.pieces || a.quantity || 0
            bValue = b.pieces || b.quantity || 0
            break
          case "date":
            aValue = new Date(a.created_at).getTime()
            bValue = new Date(b.created_at).getTime()
            break
          default:
            aValue = a[sortConfig.key as keyof ItemHistory]
            bValue = b[sortConfig.key as keyof ItemHistory]
        }

        // Universal sorting logic - works for all data types
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [historyData, searchTerm, stockInFilter, stockOutFilter, itemUpdatedFilter, selectedItem, selectedPerformedBy, selectedDateRange, sortConfig])

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = processedData.slice(startIndex, endIndex)
  
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"
    
    // Toggle direction if clicking the same column
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    
    setSortConfig({ key, direction })
  }

  const resetFilters = () => {
    setSearchTerm("")
    setStockInFilter(false)
    setStockOutFilter(false)
    setItemUpdatedFilter(false)
    setSelectedItem("all")
    setSelectedPerformedBy("all")
    setSelectedDateRange("all")
    setCustomDateRange(undefined)
    setCurrentPage(1)
    setSortConfig(null)
  }

  const handleDeleteHistory = async (item: ItemHistory) => {
    try {
      await tauriApiService.deleteSupplyHistory(item.id)
      toast({
        title: "Success",
        description: `History record for ${item.name || 'item'} has been deleted successfully`,
      })
      // Reload the history data
      const data = await getSupplyHistories()
      setHistoryData(Array.isArray(data) ? data : [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete history record",
        variant: "destructive",
      })
    }
  }

  const SortIndicator = ({ column }: { column: string }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sortConfig.direction === "ascending" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  // Calculate statistics
  const stats = useMemo(() => {
    
    const totalTransactions = processedData.length
    const stockInCount = processedData.filter(item => item.action === "Stock In").length
    const stockOutCount = processedData.filter(item => item.action === "Stock Out").length
    const totalQuantity = processedData.reduce((sum, item) => sum + (item.pieces || item.quantity || 0), 0)
    
    return { totalTransactions, stockInCount, stockOutCount, totalQuantity }
  }, [processedData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-4">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Item History</h1>
            <p className="text-gray-600">Track all inventory transactions and movements</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Updates</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock In</p>
              <p className="text-2xl font-bold text-green-600">{stats.stockInCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Out</p>
              <p className="text-2xl font-bold text-red-600">{stats.stockOutCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalQuantity}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search by item name, releaser, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-white/50 border-gray-200 hover:bg-white/80">
                <Filter size={16} />
                Filter
                {(stockInFilter || stockOutFilter || itemUpdatedFilter || selectedItem !== "all" || selectedPerformedBy !== "all" || selectedDateRange !== "all") && (
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter History</SheetTitle>
                <SheetDescription>Filter the transaction history by various criteria.</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action Type</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="stockIn"
                        checked={stockInFilter}
                        onCheckedChange={(checked) => setStockInFilter(checked as boolean)}
                      />
                      <Label htmlFor="stockIn" className="text-sm">Stock In</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="stockOut"
                        checked={stockOutFilter}
                        onCheckedChange={(checked) => setStockOutFilter(checked as boolean)}
                      />
                      <Label htmlFor="stockOut" className="text-sm">Stock Out</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="itemUpdated"
                        checked={itemUpdatedFilter}
                        onCheckedChange={(checked) => setItemUpdatedFilter(checked as boolean)}
                      />
                      <Label htmlFor="itemUpdated" className="text-sm">Item Updated</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Item</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {items.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Performed By</Label>
                  <Select value={selectedPerformedBy} onValueChange={setSelectedPerformedBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {performedByUsers.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Select value={selectedDateRange} onValueChange={(value: any) => setSelectedDateRange(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Custom Date Range</Label>
                  <DateRangePicker
                    value={customDateRange}
                    onChange={(date: any) => setCustomDateRange(date)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => { 
                      resetFilters(); 
                      setTimeout(() => setIsFilterOpen(false), 100); 
                    }} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => {
                      setTimeout(() => setIsFilterOpen(false), 100);
                    }} 
                    className="flex-1 bg-[#b12025] hover:bg-[#8a1a1f]"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button 
            onClick={resetFilters}
            variant="outline" 
            className="bg-white/50 border-gray-200 hover:bg-white/80"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#4c4a4a]" />
              <p className="text-gray-600">Loading transaction history...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" key={`table-${sortConfig?.key}-${sortConfig?.direction}`}>
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("name")}
                      className="flex items-center space-x-1 hover:bg-gray-100"
                    >
                      <span>Item Name</span>
                      <SortIndicator column="name" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("action")}
                      className="flex items-center space-x-1 hover:bg-gray-100"
                    >
                      <span>Action</span>
                      <SortIndicator column="action" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("quantity")}
                      className="flex items-center space-x-1 hover:bg-gray-100"
                    >
                      <span>Quantity</span>
                      <SortIndicator column="quantity" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">Before</th>
                  <th className="text-left p-4 font-semibold text-gray-900">After</th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("performed_by")}
                      className="flex items-center space-x-1 hover:bg-gray-100"
                    >
                      <span>Performed By</span>
                      <SortIndicator column="performed_by" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">Reason</th>
                  <th className="text-left p-4 font-semibold text-gray-900">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("date")}
                      className="flex items-center space-x-1 hover:bg-gray-100"
                    >
                      <span>Date</span>
                      <SortIndicator column="date" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item, index) => (
                    <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {item.name || "Unknown Item"}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={
                            item.action === "Stock In"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : item.action === "Stock Out"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          {item.action || "Unknown"}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">
                        {item.pieces || item.quantity || 0}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {item.before_qty || item.quantity_before || 0}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {item.after_qty || item.quantity_after || 0}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {item.performed_by || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">
                          {item.reason ? (
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {item.reason}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {hasPermission(getCurrentUser(), 'supply_histories', 'delete') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs h-auto py-1"
                              onClick={() => {
                                setItemToDelete(item)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-600">
                          {searchTerm || stockInFilter || stockOutFilter || selectedItem || selectedPerformedBy || selectedDateRange !== "all"
                            ? "No transactions found matching your filters"
                            : "No transaction history available"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)} of {processedData.length} transactions
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-[#b12025] text-white" : "cursor-pointer"}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-600" />
              Delete History Record
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              Are you sure you want to delete the history record for <strong>{itemToDelete ? (itemToDelete.name || 'this item') : 'this item'}</strong>? 
              This action cannot be undone and will permanently remove the transaction record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setItemToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (itemToDelete) {
                  handleDeleteHistory(itemToDelete)
                  setIsDeleteDialogOpen(false)
                  setItemToDelete(null)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

