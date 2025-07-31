"use client"

import type React from "react"
import { Document, Page, Image, View, Text, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
} from "recharts"
import tauriApiService from "@/components/services/tauriApiService"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useToast } from "@/components/ui/use-toast"
import { DateRange } from "react-day-picker"
import { FileText, Download, BarChart3, TrendingDown, AlertTriangle, Calendar, Filter, RefreshCw } from "lucide-react"
import html2canvas from "html2canvas"

const getRandomColor = () => {
  const letters = "0123456789ABCDEF"
  let color = "#"
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

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
    width: "23%",
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
  statusBadge: {
    padding: "2px 6px",
    borderRadius: 3,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusLow: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
  },
  statusModerate: {
    backgroundColor: "#fffbeb",
    color: "#d97706",
  },
  statusHigh: {
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
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

interface LowStockData {
  supplies: Array<{
    id: string;
    name: string;
    quantity: number;
    status: string;
    category?: string;
    unit?: string;
  }>;
}

export default function LowStockReport() {
  const [data, setData] = useState<LowStockData | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartVisible, setChartVisible] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartImage, setChartImage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    startDate: {
      day: "01",
      month: "03",
      year: "2025",
    },
    endDate: {
      day: "31",
      month: "03",
      year: "2025",
    },
  })
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 2, 1),
    to: new Date(2025, 2, 31),
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const MyDocument = ({ chartImage, data }: { chartImage: string; data: any }) => {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
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
                <Text style={styles.reportTitle}>LOW STOCK REPORT</Text>
                <Text style={styles.reportSubtitle}>
                  {formData.startDate.day}/{formData.startDate.month}/{formData.startDate.year} - {formData.endDate.day}/{formData.endDate.month}/{formData.endDate.year}
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
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{data?.supplies?.length || 0}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Low Stock Items</Text>
                <Text style={styles.summaryValue}>{data?.supplies?.filter((item: any) => item.status === "Low").length || 0}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Moderate Stock Items</Text>
                <Text style={styles.summaryValue}>{data?.supplies?.filter((item: any) => item.status === "Moderate").length || 0}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>High Stock Items</Text>
                <Text style={styles.summaryValue}>{data?.supplies?.filter((item: any) => item.status === "High").length || 0}</Text>
              </View>
            </View>
          </View>

          {/* Chart Section */}
          {chartImage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chart</Text>
              <View style={styles.chartContainer}>
                <Image src={chartImage} style={styles.chartImage} />
              </View>
            </View>
          )}

          {/* Table Section */}
          {data?.supplies && data.supplies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Low Stock Items Details</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Item Name</Text>
                  <Text style={styles.tableHeaderCell}>Category</Text>
                  <Text style={styles.tableHeaderCell}>Pieces</Text>
                  <Text style={styles.tableHeaderCell}>Status</Text>
                  <Text style={styles.tableHeaderCell}>Supplier</Text>
                  <Text style={styles.tableHeaderCell}>Last Updated</Text>
                </View>
                {data.supplies.map((item: any, index: number) => (
                  <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={styles.tableCell}>{item.name}</Text>
                    <Text style={styles.tableCell}>{item.category || "N/A"}</Text>
                    <Text style={styles.tableCell}>{item.pieces}</Text>
                    <Text style={styles.tableCell}>
                      <Text style={[
                        styles.statusBadge, 
                        item.status === "Low" ? styles.statusLow : 
                        item.status === "Moderate" ? styles.statusModerate : 
                        styles.statusHigh
                      ]}>
                        {item.status}
                      </Text>
                    </Text>
                    <Text style={styles.tableCell}>{item.supplier_name || "N/A"}</Text>
                    <Text style={styles.tableCell}>{new Date(item.updated_at).toLocaleDateString()}</Text>
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
  }

  const handleCaptureChart = async () => {
    if (chartRef.current) {
      try {
        // Add a delay to ensure chart is fully rendered
        await new Promise((resolve) => setTimeout(resolve, 500))
        const canvas = await html2canvas(chartRef.current)
        const image = canvas.toDataURL("image/png")
        setChartImage(image)
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
      }
    }
  }

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const isValidDate = (d: any) => d && d.year.length === 4 && d.month.length === 2 && d.day.length === 2;
      
      if (!isValidDate(formData.startDate) || !isValidDate(formData.endDate)) {
        toast({
          title: "Invalid date format",
          description: "Please ensure all date fields are properly filled.",
          variant: "destructive",
        })
        return
      }

      const startDate = `${formData.startDate.year}-${formData.startDate.month}-${formData.startDate.day}`
      const endDate = `${formData.endDate.year}-${formData.endDate.month}-${formData.endDate.day}`

      const response = await tauriApiService.getLowStockReport()
      
      if (response && Array.isArray(response)) {
        setData({ supplies: response })
        
        // Prepare chart data
        const chartData = response.map((item: any) => ({
          name: item.name,
          pieces: item.pieces,
          status: item.status,
        }))
        setChartData(chartData)
        setChartVisible(true)
        
        // Auto-capture chart for PDF
        setTimeout(() => {
          handleCaptureChart()
        }, 1500)
        
        toast({
          title: "Report generated",
          description: "Low stock report has been generated successfully.",
        })
      } else {
        toast({
          title: "Error generating report",
          description: "Failed to generate the low stock report.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error generating report",
        description: "An unexpected error occurred while generating the report.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const get_data = async () => {
    try {
      const isValidDate = (d: any) => d && d.year.length === 4 && d.month.length === 2 && d.day.length === 2;
      
      if (!isValidDate(formData.startDate) || !isValidDate(formData.endDate)) {
        toast({
          title: "Invalid date format",
          description: "Please ensure all date fields are properly filled.",
          variant: "destructive",
        })
        return
      }

      const startDate = `${formData.startDate.year}-${formData.startDate.month}-${formData.startDate.day}`
      const endDate = `${formData.endDate.year}-${formData.endDate.month}-${formData.endDate.day}`

      const response = await tauriApiService.getLowStockReport()
      
      if (response && Array.isArray(response)) {
        setData({ supplies: response })
        
        // Prepare chart data
        const chartData = response.map((item: any) => ({
          name: item.name,
          pieces: item.pieces,
          status: item.status,
        }))
        setChartData(chartData)
        setChartVisible(true)
      } else {
        toast({
          title: "Error fetching data",
          description: "Failed to fetch the low stock data.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: "An unexpected error occurred while fetching the data.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generateReport()
  }

  useEffect(() => {
    get_data()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-4">
      {/* Header Section */}
              <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Low Stock Report</h1>
            <p className="text-gray-600">Monitor and analyze items with low stock levels</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Real-time Monitoring</span>
            </div>
            {chartImage && data && (
              <PDFDownloadLink 
                document={<MyDocument chartImage={chartImage} data={data} />} 
                fileName={`low-stock-report-${formData.startDate.year}-${formData.startDate.month}-${formData.startDate.day}.pdf`}
              >
                {({ loading }) => (
                  <Button 
                    disabled={loading}
                    className="bg-[#b12025] hover:bg-[#8a1a1f] text-white flex items-center shadow-lg"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {loading ? "Generating..." : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{data.supplies?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.supplies?.filter((item: any) => item.status === "Low").length || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Moderate Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.supplies?.filter((item: any) => item.status === "Moderate").length || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.supplies?.filter((item: any) => item.status === "High").length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
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
            onClick={get_data}
            variant="outline"
            className="bg-white/50 border-gray-200 hover:bg-white/80"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date Range</Label>
              <DateRangePicker
                value={dateRange}
                onChange={(date: any) => setDateRange(date)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Manual Date Entry</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Start Date</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="DD"
                      value={formData.startDate.day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: { ...formData.startDate, day: e.target.value },
                        })
                      }
                      className="text-center"
                    />
                    <Input
                      placeholder="MM"
                      value={formData.startDate.month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: { ...formData.startDate, month: e.target.value },
                        })
                      }
                      className="text-center"
                    />
                    <Input
                      placeholder="YYYY"
                      value={formData.startDate.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: { ...formData.startDate, year: e.target.value },
                        })
                      }
                      className="text-center"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">End Date</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="DD"
                      value={formData.endDate.day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endDate: { ...formData.endDate, day: e.target.value },
                        })
                      }
                      className="text-center"
                    />
                    <Input
                      placeholder="MM"
                      value={formData.endDate.month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endDate: { ...formData.endDate, month: e.target.value },
                        })
                      }
                      className="text-center"
                    />
                    <Input
                      placeholder="YYYY"
                      value={formData.endDate.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          endDate: { ...formData.endDate, year: e.target.value },
                        })
                      }
                      className="text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#b12025] hover:bg-[#8a1a1f] text-white flex items-center"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
            
            {chartVisible && (
              <Button
                type="button"
                onClick={handleCaptureChart}
                variant="outline"
                className="bg-white/50 border-gray-200 hover:bg-white/80"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Capture Chart
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Chart Section */}
      {chartVisible && chartData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Stock Level Visualization
            </h3>
          </div>
          <div ref={chartRef} className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pieces" fill="#b12025" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      {data && data.supplies && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Low Stock Items Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">Item Name</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Pieces</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Supplier</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.supplies.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {item.category || "N/A"}
                    </td>
                    <td className="p-4 font-medium">
                      {item.pieces}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          item.status === "Low"
                            ? "bg-red-500"
                            : item.status === "Moderate"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {item.supplier_name || "N/A"}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

