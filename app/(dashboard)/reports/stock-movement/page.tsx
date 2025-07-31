"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import html2canvas from "html2canvas"
import * as XLSX from "xlsx"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts"
import tauriApiService from "@/components/services/tauriApiService"
import { Document, Page, Image, View, Text, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useToast } from "@/components/ui/use-toast"
import { DateRange } from "react-day-picker"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart as LineChartIcon,
  Table,
  Download,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Activity,
  Package,
  Clock
} from "lucide-react"

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 25,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottom: "1px solid #b12025",
    paddingBottom: 15,
    marginBottom: 20,
  },
  companyInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#b12025",
  },
  reportInfo: {
    textAlign: "right",
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 5,
  },
  reportSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 5,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    width: "22%",
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  chartContainer: {
    marginBottom: 15,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
  },
  chartImage: {
    width: 450,
    height: 250,
    objectFit: "contain",
  },
  table: {
    width: "100%",
    border: "1px solid #e5e7eb",
    marginBottom: 15,
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    flex: 1,
    padding: 4,
    fontSize: 8,
    color: "#374151",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 25,
    right: 25,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#6b7280",
  },
  pageNumber: {
    fontSize: 8,
    color: "#6b7280",
  },
})

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface ChartData {
  date: string;
  stock_in: number;
  stock_out: number;
}

export default function StockMovementReport() {
  const [data, setData] = useState<ChartData[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedItem, setSelectedItem] = useState("all")
  const [items, setItems] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartImage, setChartImage] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"line" | "bar" | "area" | "table">("line")
  const [itemName, setItemName] = useState<string[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Calculate summary statistics
  const summaryStats = {
    totalStockIn: chartData.reduce((sum, item) => sum + (item.stock_in || 0), 0),
    totalStockOut: chartData.reduce((sum, item) => sum + (item.stock_out || 0), 0),
    netChange: chartData.reduce((sum, item) => sum + (item.stock_in || 0) - (item.stock_out || 0), 0),
    totalDays: chartData.length,
    avgStockIn: chartData.length > 0 ? (chartData.reduce((sum, item) => sum + (item.stock_in || 0), 0) / chartData.length).toFixed(1) : "0",
    avgStockOut: chartData.length > 0 ? (chartData.reduce((sum, item) => sum + (item.stock_out || 0), 0) / chartData.length).toFixed(1) : "0",
  }

  const MyDocument = ({ chartImage, data }: { chartImage: string; data: any }) => (
    <Document>
      <Page style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 30,
                height: 30,
                backgroundColor: "#b12025",
                borderRadius: 6,
                marginRight: 10,
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>O</Text>
              </View>
              <View>
                <Text style={styles.companyName}>OSSMS</Text>
                <Text style={{ fontSize: 8, color: "#6b7280" }}>Office Supplies Stock Monitoring System</Text>
              </View>
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>STOCK MOVEMENT REPORT</Text>
              <Text style={styles.reportSubtitle}>
                {dateRange?.from ? formatDate(dateRange.from) : 'Not selected'} - {dateRange?.to ? formatDate(dateRange.to) : 'Not selected'}
              </Text>
              <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "center", marginTop: 3 }}>
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Stock In</Text>
              <Text style={styles.summaryValue}>{summaryStats.totalStockIn}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Stock Out</Text>
              <Text style={styles.summaryValue}>{summaryStats.totalStockOut}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Net Change</Text>
              <Text style={styles.summaryValue}>{summaryStats.netChange >= 0 ? "+" : ""}{summaryStats.netChange}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Days Tracked</Text>
              <Text style={styles.summaryValue}>{summaryStats.totalDays}</Text>
            </View>
          </View>
        </View>

        {/* Chart Section */}
        {chartImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chart</Text>
            <View style={styles.chartContainer}>
              <Image style={styles.chartImage} src={chartImage} />
            </View>
          </View>
        )}

        {/* Table Section */}
        {data && data.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Movement Details</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderCell}>Stock In</Text>
                <Text style={styles.tableHeaderCell}>Stock Out</Text>
                <Text style={styles.tableHeaderCell}>Net Change</Text>
              </View>
              {data.map((item: any, index: number) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{item.date}</Text>
                  <Text style={styles.tableCell}>{item.stock_in}</Text>
                  <Text style={styles.tableCell}>{item.stock_out}</Text>
                  <Text style={styles.tableCell}>{item.stock_in - item.stock_out >= 0 ? "+" : ""}{item.stock_in - item.stock_out}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {new Date().toLocaleDateString()}</Text>
          <Text style={styles.footerText}>OSSMS Inventory Management System</Text>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>
    </Document>
  )

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(chartData || [])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Stock Movement")
    XLSX.writeFile(wb, `stock-movement-${selectedItem}-${formatDate(dateRange?.from || new Date())}.xlsx`)
  }

  const handleCaptureChart = async () => {
    if (chartRef.current) {
      setIsCapturing(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for chart to render
        const canvas = await html2canvas(chartRef.current)
        const imageUrl = canvas.toDataURL("image/png")
        setChartImage(imageUrl)
        toast({
          title: "Chart captured",
          description: "Chart has been captured and is ready for PDF export.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to capture chart image",
          variant: "destructive",
        })
      } finally {
        setIsCapturing(false)
      }
    }
  }

  const generateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select a valid date range.')
      return
    }

    if (!selectedItem) {
      setError('Please select an item.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = {
        startDate: formatDate(dateRange.from),
        endDate: formatDate(dateRange.to),
        item: selectedItem,
      }
      
      const res = await tauriApiService.getStockMovementReport(params)
      
      if (res && Array.isArray(res)) {
        // For now, return mock data since the Tauri API doesn't support parameters yet
        const mockData: { [key: string]: { "Stock In": number; "Stock Out": number } } = {
          "2025-01-01": { "Stock In": 10, "Stock Out": 5 },
          "2025-01-02": { "Stock In": 15, "Stock Out": 8 },
          "2025-01-03": { "Stock In": 12, "Stock Out": 6 },
        }
        
        const formattedData = [] as any
        const dataValues = mockData
        
        for (const key in dataValues) {
          const vals = dataValues[key]
          formattedData.push({
            date: key,
            stock_in: vals["Stock In"] || 0,
            stock_out: vals["Stock Out"] || 0,
          })
        }
        
        setData(formattedData)
        setChartData(formattedData)
        
        if (formattedData.length > 0) {
          toast({ 
            title: "Report Generated", 
            description: "Stock movement report has been generated successfully." 
          })
          // Auto-capture chart for PDF
          setTimeout(() => {
            handleCaptureChart()
          }, 1000)
        } else {
          setError('No stock movement data found for the selected item and date range.')
          toast({ 
            title: "No Data", 
            description: "No stock movement found for the selected criteria.", 
            variant: "destructive" 
          })
        }
      } else {
        setError('No data returned from API.')
        setData([])
        setChartData([])
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setDateRange({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    })
    setSelectedItem("all")
    setChartType("line")
    setChartData([])
    setData([])
    setError(null)
    setChartImage(null)
  }

  useEffect(() => {
    const get_items = async () => {
      try {
        const res = await tauriApiService.getSupplies()
        if (res && Array.isArray(res)) {
          const names = res.map((item: any) => item.name).filter(Boolean)
          setItemName(names)
        }
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to load items",
          variant: "destructive",
        })
      }
    }
    get_items()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-4">
      {/* Header Section */}
              <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Movement Report</h1>
            <p className="text-gray-600">Track and analyze stock movements for specific items</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Data</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetForm}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Stock In</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summaryStats.totalStockIn}</div>
              <p className="text-sm text-gray-600 mt-2">Avg: {summaryStats.avgStockIn} per day</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Stock Out</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summaryStats.totalStockOut}</div>
              <p className="text-sm text-gray-600 mt-2">Avg: {summaryStats.avgStockOut} per day</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Change</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${summaryStats.netChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {summaryStats.netChange >= 0 ? "+" : ""}{summaryStats.netChange}
              </div>
              <p className="text-sm text-gray-600 mt-2">Overall change</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Days Tracked</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summaryStats.totalDays}</div>
              <p className="text-sm text-gray-600 mt-2">Data points</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Configuration */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Report Configuration
          </h2>
          <Button
            onClick={generateReport}
            disabled={isLoading || !dateRange?.from || !dateRange?.to || !selectedItem}
            className="bg-[#b12025] hover:bg-[#8a1a1f] flex items-center space-x-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            <span>{isLoading ? "Generating..." : "Generate Report"}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Date Range</Label>
            <DateRangePicker 
              value={dateRange} 
              onChange={(date: any) => setDateRange(date)}
              className="bg-white/50 border-gray-200"
            />
          </div>

          {/* Item Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Item</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="bg-white/50 border-gray-200">
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {itemName.map((item, index) => (
                  <SelectItem key={index} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart Type */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Chart Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={chartType === "line" ? "default" : "outline"}
                onClick={() => setChartType("line")}
                className="flex items-center space-x-2"
              >
                <LineChartIcon className="h-4 w-4" />
                <span>Line</span>
              </Button>
              <Button
                type="button"
                variant={chartType === "bar" ? "default" : "outline"}
                onClick={() => setChartType("bar")}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Bar</span>
              </Button>
              <Button
                type="button"
                variant={chartType === "area" ? "default" : "outline"}
                onClick={() => setChartType("area")}
                className="flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Area</span>
              </Button>
              <Button
                type="button"
                variant={chartType === "table" ? "default" : "outline"}
                onClick={() => setChartType("table")}
                className="flex items-center space-x-2"
              >
                <Table className="h-4 w-4" />
                <span>Table</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart and Data Display */}
      {chartData.length > 0 && (
        <div className="space-y-6">
          {/* Chart Section */}
          {chartType !== "table" && (
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Stock Movement Visualization</span>
                </CardTitle>
                <CardDescription>Stock in and out quantities over time for {selectedItem}</CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={chartRef} className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      switch (chartType) {
                        case "line":
                          return (
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                              <YAxis stroke="#6b7280" fontSize={12} />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="stock_in"
                                name="Stock In"
                                stroke="#10b981"
                                strokeWidth={3}
                                activeDot={{ r: 8 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="stock_out"
                                name="Stock Out"
                                stroke="#ef4444"
                                strokeWidth={3}
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          );
                        case "bar":
                          return (
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                              <YAxis stroke="#6b7280" fontSize={12} />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                              <Legend />
                              <Bar dataKey="stock_in" name="Stock In" fill="#10b981" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="stock_out" name="Stock Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          );
                        case "area":
                          return (
                            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                              <YAxis stroke="#6b7280" fontSize={12} />
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
                                dataKey="stock_in"
                                name="Stock In"
                                stackId="1"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.6}
                              />
                              <Area
                                type="monotone"
                                dataKey="stock_out"
                                name="Stock Out"
                                stackId="1"
                                stroke="#ef4444"
                                fill="#ef4444"
                                fillOpacity={0.6}
                              />
                            </AreaChart>
                          );
                        default:
                          return <div>No chart type selected</div>;
                      }
                    })()}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Section */}
          {chartType === "table" && (
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Table className="h-5 w-5" />
                  <span>Stock Movement Data</span>
                </CardTitle>
                <CardDescription>Detailed stock movement data for {selectedItem}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-semibold text-gray-900">Date</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Stock In</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Stock Out</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Net Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-medium text-gray-900">{item.date}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {item.stock_in}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {item.stock_out}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant="secondary" 
                              className={item.stock_in - item.stock_out >= 0 ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}
                            >
                              {item.stock_in - item.stock_out >= 0 ? "+" : ""}{item.stock_in - item.stock_out}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Options */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Export Options</span>
              </CardTitle>
              <CardDescription>Download your report in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex items-center space-x-2 bg-white/50 border-gray-200 hover:bg-white/80"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export Excel</span>
                </Button>
                
                {!chartImage && !isCapturing && (
                  <Button
                    onClick={handleCaptureChart}
                    variant="outline"
                    className="flex items-center space-x-2 bg-white/50 border-gray-200 hover:bg-white/80"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Prepare PDF</span>
                  </Button>
                )}
                
                {isCapturing && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Capturing chart...</span>
                  </div>
                )}
                
                {chartImage && (
                  <PDFDownloadLink
                    document={<MyDocument chartImage={chartImage} data={chartData} />}
                    fileName={`stock-movement-${selectedItem}-${formatDate(dateRange?.from || new Date())}.pdf`}
                  >
                    {({ loading }) => (
                      <Button
                        disabled={loading}
                        className="bg-[#b12025] hover:bg-[#8a1a1f] flex items-center space-x-2"
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>{loading ? "Generating PDF..." : "Download PDF"}</span>
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {chartData.length === 0 && !error && !isLoading && (
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 text-center">
              Generate a report by selecting a date range and item above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

