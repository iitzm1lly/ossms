"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Activity, 
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  ArrowRight,
  Users,
  Clock,
  Target,
  Zap
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import tauriApiService from "@/components/services/tauriApiService"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { useRouter } from "next/navigation"

interface ItemHistory {
  id: number
  name?: string
  item_name?: string
  pieces?: number
  quantity?: number
  quantity_before?: number
  quantity_after?: number
  before_qty?: number
  after_qty?: number
  performed_by?: string
  releaser?: string
  releaser_name?: string
  created_at: string
  reason?: string
  action?: string
}

// Helper function to convert EnrichedSupplyHistory to ItemHistory
const convertSupplyHistoryToItemHistory = (history: any, index: number): ItemHistory => {
  // Ensure we have a valid ID, use a more robust approach
  let validId: number
  if (history.id && !isNaN(Number(history.id))) {
    validId = Number(history.id)
  } else {
    // Use timestamp + index for unique ID if no valid ID exists
    validId = Date.now() + index
  }
  
  return {
    id: validId,
    name: history.supply_name || 'Unknown Item',
    item_name: history.supply_name || 'Unknown Item',
    pieces: history.quantity || 0,
    quantity: history.quantity || 0,
    quantity_before: history.previous_quantity || 0,
    quantity_after: history.new_quantity || 0,
    before_qty: history.previous_quantity || 0,
    after_qty: history.new_quantity || 0,
    performed_by: history.user_name || 'Unknown User',
    releaser: history.user_name || 'Unknown User',
    releaser_name: history.user_name || 'Unknown User',
    created_at: history.created_at || new Date().toISOString(),
    reason: history.notes || "",
    action: history.action || "Unknown",
  }
}

interface HistoryStats {
  totalRecords: number
  stockInCount: number
  stockOutCount: number
  recentActivity: number
}

export default function ItemHistoryDashboard() {
  const [stats, setStats] = useState<HistoryStats>({
    totalRecords: 0,
    stockInCount: 0,
    stockOutCount: 0,
    recentActivity: 0,
  })
  const [historyData, setHistoryData] = useState<ItemHistory[]>([])
  const [selectedItem, setSelectedItem] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [items, setItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch history data
  const loadHistory = async () => {
    try {
      setIsRefreshing(true)
      const data = await tauriApiService.getSupplyHistories()

      if (data && Array.isArray(data)) {
        const historyRecords = data.map((history, index) => convertSupplyHistoryToItemHistory(history, index))
        
        if (!historyRecords || historyRecords.length === 0) {
          toast({
            title: "No item history data found",
            description: "There are no item history records in the database.",
            variant: "destructive",
          })
          setHistoryData([])
          setStats({
            totalRecords: 0,
            stockInCount: 0,
            stockOutCount: 0,
            recentActivity: 0,
          })
          setItems([])
          return
        }
        
        setHistoryData(historyRecords)
        
        // Calculate stats with validation
        const stockInCount = historyRecords.filter((record) => record.action === 'Stock In').length
        const stockOutCount = historyRecords.filter((record) => record.action === 'Stock Out').length
        
        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentActivity = historyRecords.filter((record) => {
          try {
            const recordDate = new Date(record.created_at)
            return recordDate >= sevenDaysAgo
          } catch (error) {
            return false
          }
        }).length

        setStats({
          totalRecords: historyRecords.length,
          stockInCount,
          stockOutCount,
          recentActivity,
        })

        // Automatically set date range to cover all data
        if (historyRecords.length > 0) {
          try {
            const dates = historyRecords
              .map((r: ItemHistory) => new Date(r.created_at))
              .filter((date: Date) => !isNaN(date.getTime()))
            
            if (dates.length > 0) {
              const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
              const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
              setDateRange({ from: minDate, to: maxDate })
            }
          } catch (error) {
            // If date parsing fails, use current date range
            const now = new Date()
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            setDateRange({ from: weekAgo, to: now })
          }
        }

        // Extract unique items with validation
        const uniqueItems = Array.from(
          new Set(
            historyRecords
              .filter((item: ItemHistory) => item.name && item.name.trim() !== '')
              .map((item: ItemHistory) => item.name),
          ),
        )
        setItems(uniqueItems as string[])
      } else {
        throw new Error("Failed to load history data - invalid data format")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load history data. Please try again.",
        variant: "destructive",
      })
      setHistoryData([])
      setStats({
        totalRecords: 0,
        stockInCount: 0,
        stockOutCount: 0,
        recentActivity: 0,
      })
      setItems([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // Filter data based on selected item and date range
  const filteredData = useMemo(() => {
    let filtered = [...historyData]

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      const fromDate = new Date(dateRange.from)
      const toDate = new Date(dateRange.to)
      toDate.setHours(23, 59, 59, 999) // Include the entire end day

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.created_at)
        return itemDate >= fromDate && itemDate <= toDate
      })
    }

    // Filter by selected item
    if (selectedItem !== "all") {
      filtered = filtered.filter((item) => (item.name || item.item_name) === selectedItem)
    }

    return filtered
  }, [historyData, selectedItem, dateRange])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stockInCount = filteredData.filter((item) => item.action === "Stock In").length
    const stockOutCount = filteredData.filter((item) => item.action === "Stock Out").length

    const stockInTotal = filteredData
      .filter((item) => item.action === "Stock In")
      .reduce((sum, item) => sum + (item.quantity || item.pieces || 0), 0)

    const stockOutTotal = filteredData
      .filter((item) => item.action === "Stock Out")
      .reduce((sum, item) => sum + (item.quantity || item.pieces || 0), 0)

    // Get unique items in the filtered data
    const uniqueItemsCount = new Set(filteredData.map((item) => item.name || item.item_name)).size

    // Calculate average daily transactions
    const daysDiff = dateRange?.from && dateRange?.to 
      ? Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1
    const avgDailyTransactions = daysDiff > 0 ? (filteredData.length / daysDiff).toFixed(1) : "0"

    return {
      stockInCount,
      stockOutCount,
      stockInTotal,
      stockOutTotal,
      netChange: stockInTotal - stockOutTotal,
      uniqueItemsCount,
      totalTransactions: filteredData.length,
      avgDailyTransactions,
      daysDiff,
    }
  }, [filteredData, dateRange])

  // Prepare data for charts
  const chartData = useMemo(() => {
    // Validate filtered data
    if (!filteredData || filteredData.length === 0) {
      return {
        timeline: [],
        itemDistribution: [],
        actionDistribution: [
          { name: "Stock In", value: 0, color: "#10b981" },
          { name: "Stock Out", value: 0, color: "#ef4444" },
        ],
        topItems: [],
      }
    }

    // Group by date for timeline chart
    const timelineData: Record<string, { date: string; stockIn: number; stockOut: number; net: number }> = {}

    filteredData.forEach((record) => {
      if (!record.created_at) return
      
      try {
        const date = new Date(record.created_at).toISOString().split("T")[0]
        
        if (!timelineData[date]) {
          timelineData[date] = { date, stockIn: 0, stockOut: 0, net: 0 }
        }

        const quantity = record.quantity || record.pieces || 0
        if (record.action === "Stock In") {
          timelineData[date].stockIn += quantity
          timelineData[date].net += quantity
        } else if (record.action === "Stock Out") {
          timelineData[date].stockOut += quantity
          timelineData[date].net -= quantity
        }
      } catch (error) {
        // Skip invalid dates
        return
      }
    })

    // Group by item for item distribution chart
    const itemDistribution: Record<string, { stockIn: number; stockOut: number; net: number }> = {}

    filteredData.forEach((record) => {
      const itemName = record.name || record.item_name || "Unknown"
      const quantity = record.quantity || record.pieces || 0

      if (!itemDistribution[itemName]) {
        itemDistribution[itemName] = { stockIn: 0, stockOut: 0, net: 0 }
      }

      if (record.action === "Stock In") {
        itemDistribution[itemName].stockIn += quantity
        itemDistribution[itemName].net += quantity
      } else if (record.action === "Stock Out") {
        itemDistribution[itemName].stockOut += quantity
        itemDistribution[itemName].net -= quantity
      }
    })

    // Group by action type for pie chart
    const actionDistribution = [
      { name: "Stock In", value: summaryStats.stockInCount, color: "#10b981" },
      { name: "Stock Out", value: summaryStats.stockOutCount, color: "#ef4444" },
    ]

    // Top performing items (by transaction count)
    const itemTransactionCount: Record<string, number> = {}
    filteredData.forEach((record) => {
      const itemName = record.name || record.item_name || "Unknown"
      itemTransactionCount[itemName] = (itemTransactionCount[itemName] || 0) + 1
    })

    const topItems = Object.entries(itemTransactionCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    return {
      timeline: Object.values(timelineData).sort((a, b) => a.date.localeCompare(b.date)),
      itemDistribution: Object.entries(itemDistribution).map(([name, data]) => ({ 
        name, 
        stockIn: data.stockIn, 
        stockOut: data.stockOut, 
        net: data.net 
      })),
      actionDistribution,
      topItems,
    }
  }, [filteredData, summaryStats])

  // Colors for charts
  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4"]

  const resetFilters = () => {
    setSelectedItem("all")
    if (historyData.length > 0) {
      const dates = historyData.map((r: ItemHistory) => new Date(r.created_at))
      const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
      setDateRange({ from: minDate, to: maxDate })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">History Dashboard</h1>
            <p className="text-gray-600">Analytics and insights from your inventory transactions</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Data</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadHistory}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button 
              onClick={() => router.push("/item-history")}
              className="bg-[#b12025] hover:bg-[#8a1a1f] flex items-center space-x-2"
            >
              <span>View Details</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Item</label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="bg-white/50 border-gray-200">
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

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Date Range</label>
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange}
              className="bg-white/50 border-gray-200"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#b12025]" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{summaryStats.totalTransactions}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {summaryStats.stockInCount} In
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {summaryStats.stockOutCount} Out
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Net Change</CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  {summaryStats.netChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${summaryStats.netChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {summaryStats.netChange >= 0 ? "+" : ""}{summaryStats.netChange}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {summaryStats.stockInTotal} in • {summaryStats.stockOutTotal} out
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Items Affected</CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{summaryStats.uniqueItemsCount}</div>
                <p className="text-sm text-gray-600 mt-2">Unique items with activity</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Daily Average</CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{summaryStats.avgDailyTransactions}</div>
                <p className="text-sm text-gray-600 mt-2">Transactions per day</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            <Tabs defaultValue="distribution" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-white/20">
                <TabsTrigger value="timeline" className="flex items-center space-x-2">
                  <LineChart className="h-4 w-4" />
                  <span>Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="distribution" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Item Performance</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Actions</span>
                </TabsTrigger>
                <TabsTrigger value="topItems" className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Top Items</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-6">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <LineChart className="h-5 w-5" />
                      <span>Stock Movement Timeline</span>
                    </CardTitle>
                    <CardDescription>Track stock in and out quantities over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[450px]">
                    {chartData.timeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.timeline} margin={{ top: 10, right: 40, left: 30, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#6b7280"
                            fontSize={11}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={11}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="stockIn"
                            name="Stock In"
                            stackId="1"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="stockOut"
                            name="Stock Out"
                            stackId="1"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                          />
                          <Line
                            type="monotone"
                            dataKey="net"
                            name="Net Change"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No data available for the selected filters</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="distribution" className="mt-6">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Item Performance</span>
                    </CardTitle>
                    <CardDescription>Net quantity change for each item</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[500px]">
                    {chartData.itemDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.itemDistribution}
                          margin={{ top: 10, right: 40, left: 30, bottom: 120 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6b7280"
                            fontSize={11}
                            angle={-45}
                            textAnchor="end"
                            height={120}
                            interval={0}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            fontSize={12}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="stockIn"
                            name="Stock In"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="stockOut"
                            name="Stock Out"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No data available for the selected filters</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="mt-6">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <span>Transaction Types</span>
                    </CardTitle>
                    <CardDescription>Distribution of stock in vs stock out transactions</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[450px]">
                    {summaryStats.totalTransactions > 0 && chartData.actionDistribution.some(item => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData.actionDistribution.filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.actionDistribution.filter(item => item.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value} transactions`, "Count"]}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No data available for the selected filters</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topItems" className="mt-6">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Most Active Items</span>
                    </CardTitle>
                    <CardDescription>Items with the highest transaction frequency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chartData.topItems.length > 0 ? (
                        chartData.topItems.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/20">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.count} transactions</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              #{index + 1}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No data available for the selected filters</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}

