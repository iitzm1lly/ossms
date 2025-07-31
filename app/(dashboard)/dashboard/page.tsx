"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Users, Package, History, TrendingUp, TrendingDown, AlertTriangle, Plus, Eye, BarChart3, RefreshCw } from "lucide-react"
import tauriApiService from "@/components/services/tauriApiService"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUser, hasPermission } from "@/lib/permissions"

interface Stats {
  itemCount: number
  userCount: number
  historyCount: number
  lowStockCount: number
  reportCount: number
}

interface User {
  id: string | number
  username: string
  firstname?: string
  lastname?: string
  email?: string
  role: string
  permissions?: any
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    itemCount: 0,
    userCount: 0,
    historyCount: 0,
    lowStockCount: 0,
    reportCount: 4,
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [userPermissions, setUserPermissions] = useState({
    canViewSupplies: false,
    canViewHistory: false,
    canViewReports: false,
    canViewUsers: false,
    canCreateSupplies: false,
    canCreateUsers: false,
  })
  const [currentUser, setCurrentUser] = useState<User | null>(null)


  // Helper function to check if current user is admin
  const isCurrentUserAdmin = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return false
      const user = JSON.parse(userStr)
      return user?.role === 'admin' || user?.username === 'admin'
    } catch (error) {
      return false
    }
  }



  const getItems = async () => {
    try {
      const res = await tauriApiService.getSupplies()
      if (res && Array.isArray(res)) {
        setStats(prev => ({ ...prev, itemCount: res.length }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      })
    }
  }

  const getSupplyHistories = async () => {
    try {
      const res = await tauriApiService.getSupplyHistories()
      if (res && Array.isArray(res)) {
        setStats(prev => ({ ...prev, historyCount: res.length }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load supply histories",
        variant: "destructive",
      })
    }
  }

  const getUsers = async () => {
    try {
      const res = await tauriApiService.getUsers()
      if (res && Array.isArray(res)) {
        setStats(prev => ({ ...prev, userCount: res.length }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    await Promise.all([getItems(), getSupplyHistories(), getUsers()])
    setIsLoading(false)
  }







  useEffect(() => {
    // Get current user first
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        
        // Set user permissions after user is loaded
        // If user has staff role but no permissions, assign default staff permissions
        let effectivePermissions = user.permissions;
        
        // Check if user has staff role but no valid permissions
        const hasNoValidPermissions = !user.permissions || 
          (typeof user.permissions === 'string' && !user.permissions.trim()) ||
          (typeof user.permissions === 'object' && Object.keys(user.permissions).length === 0);
        
        if ((user.role === 'staff' || user.role === 'Staff') && hasNoValidPermissions) {
          effectivePermissions = {
            supplies: ["view", "create", "edit"],
            supply_histories: ["view", "create"],
            reports: ["view"]
          };
          // Assigning default staff permissions
        }
        
        setUserPermissions({
          canViewSupplies: hasPermission({ ...user, permissions: effectivePermissions }, 'supplies', 'view'),
          canViewHistory: hasPermission({ ...user, permissions: effectivePermissions }, 'supply_histories', 'view'),
          canViewReports: hasPermission({ ...user, permissions: effectivePermissions }, 'reports', 'view'),
          canViewUsers: hasPermission({ ...user, permissions: effectivePermissions }, 'users', 'view'),
          canCreateSupplies: hasPermission({ ...user, permissions: effectivePermissions }, 'supplies', 'create'),
          canCreateUsers: hasPermission({ ...user, permissions: effectivePermissions }, 'users', 'create'),
        })
        
        // If permissions is a string, try to parse it
        if (typeof user.permissions === 'string' && user.permissions.trim()) {
          try {
            user.permissions = JSON.parse(user.permissions)
            // Update localStorage with parsed permissions
            localStorage.setItem("user", JSON.stringify(user))
          } catch (error) {
            console.error('Error parsing permissions string:', error)
            user.permissions = {}
          }
        }
        

      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }

    // Refined welcome toast logic
    const showWelcome = () => {
      const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || '{}') : null;
      const justLoggedIn = localStorage.getItem("justLoggedIn") === "true";
      if (justLoggedIn) {
        setTimeout(() => {
          if (user && user.firstname) {
            toast({
              title: `Welcome back, ${user.firstname}!`,
              description: "Glad to see you on the dashboard.",
            });
          } else {
            toast({
              title: "Welcome!",
              description: "Glad to see you on the dashboard.",
            });
          }
          localStorage.removeItem("justLoggedIn");
        }, 400); // 400ms delay to ensure dashboard is mounted
      }
    };
    showWelcome();
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-4">
      {/* Role-Based Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isCurrentUserAdmin() ? "Admin Dashboard" : 
               (currentUser?.role === 'staff' || currentUser?.role === 'Staff') ? "Staff Dashboard" : 
               currentUser?.role === 'viewer' ? "Viewer Dashboard" : "Dashboard"}
            </h1>
            <p className="text-gray-600">
              {isCurrentUserAdmin() ? "Full system access and management capabilities" :
               (currentUser?.role === 'staff' || currentUser?.role === 'Staff') ? "Inventory management and reporting access" :
               currentUser?.role === 'viewer' ? "Read-only access to system information" :
               "System access"}
            </p>
            {currentUser && (
              <div className="flex items-center mt-2 space-x-4">
                <Badge variant={currentUser.role === 'admin' ? 'default' : currentUser.role === 'staff' ? 'secondary' : 'outline'}>
                  {currentUser.role?.toUpperCase() || 'VIEWER'}
                </Badge>
                <span className="text-sm text-gray-500">
                  Welcome, {currentUser.firstname || currentUser.username}
                </span>

              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live System</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadData}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            

            

            

          </div>
        </div>
      </div>

      {/* Role-Based Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Admin sees all stats */}
        {isCurrentUserAdmin() && (
          <>
            <DashboardCard
              title="Total Inventory"
              value={isLoading ? "..." : stats.itemCount.toString()}
              link="/inventory/view-items"
              icon={<Package className="h-6 w-6" />}
              gradient="from-blue-500 to-blue-600"
              bgGradient="from-blue-50 to-blue-100"
              description="Items in stock"
            />
            <DashboardCard
              title="Item History"
              value={isLoading ? "..." : stats.historyCount.toString()}
              link="/item-history"
              icon={<History className="h-6 w-6" />}
              gradient="from-green-500 to-green-600"
              bgGradient="from-green-50 to-green-100"
              description="Transaction records"
            />
            <DashboardCard
              title="Available Reports"
              value={stats.reportCount.toString()}
              link="/reports/low-stock"
              icon={<TrendingUp className="h-6 w-6" />}
              gradient="from-purple-500 to-purple-600"
              bgGradient="from-purple-50 to-purple-100"
              description="Stock & movement reports"
            />
            <DashboardCard
              title="System Users"
              value={isLoading ? "..." : stats.userCount.toString()}
              link="/users/view-users"
              icon={<Users className="h-6 w-6" />}
              gradient="from-orange-500 to-orange-600"
              bgGradient="from-orange-50 to-orange-100"
              description="Active accounts"
            />
          </>
        )}

        {/* Staff sees inventory, history, and reports */}
        {(currentUser?.role === 'staff' || currentUser?.role === 'Staff') && !isCurrentUserAdmin() && (
          <>
            {/* Always show these for staff users, regardless of permissions */}
            <DashboardCard
              title="Total Inventory"
              value={isLoading ? "..." : stats.itemCount.toString()}
              link="/inventory/view-items"
              icon={<Package className="h-6 w-6" />}
              gradient="from-blue-500 to-blue-600"
              bgGradient="from-blue-50 to-blue-100"
              description="Items in stock"
            />
            <DashboardCard
              title="Item History"
              value={isLoading ? "..." : stats.historyCount.toString()}
              link="/item-history"
              icon={<History className="h-6 w-6" />}
              gradient="from-green-500 to-green-600"
              bgGradient="from-green-50 to-green-100"
              description="Transaction records"
            />
            <DashboardCard
              title="Available Reports"
              value={stats.reportCount.toString()}
              link="/reports/low-stock"
              icon={<TrendingUp className="h-6 w-6" />}
              gradient="from-purple-500 to-purple-600"
              bgGradient="from-purple-50 to-purple-100"
              description="Stock & movement reports"
            />
            {/* Only show users card if they have permission */}
            {userPermissions.canViewUsers && (
              <DashboardCard
                title="System Users"
                value={isLoading ? "..." : stats.userCount.toString()}
                link="/users/view-users"
                icon={<Users className="h-6 w-6" />}
                gradient="from-orange-500 to-orange-600"
                bgGradient="from-orange-50 to-orange-100"
                description="Active accounts"
              />
            )}
          </>
        )}

        {/* Viewer sees limited stats - only show if explicitly viewer role */}
        {currentUser?.role === 'viewer' && !isCurrentUserAdmin() && (
          <>
            {userPermissions.canViewSupplies && (
              <DashboardCard
                title="Total Inventory"
                value={isLoading ? "..." : stats.itemCount.toString()}
                link="/inventory/view-items"
                icon={<Package className="h-6 w-6" />}
                gradient="from-blue-500 to-blue-600"
                bgGradient="from-blue-50 to-blue-100"
                description="Items in stock"
              />
            )}
            {userPermissions.canViewHistory && (
              <DashboardCard
                title="Item History"
                value={isLoading ? "..." : stats.historyCount.toString()}
                link="/item-history"
                icon={<History className="h-6 w-6" />}
                gradient="from-green-500 to-green-600"
                bgGradient="from-green-50 to-green-100"
                description="Transaction records"
              />
            )}
            {userPermissions.canViewReports && (
              <DashboardCard
                title="Available Reports"
                value={stats.reportCount.toString()}
                link="/reports/low-stock"
                icon={<TrendingUp className="h-6 w-6" />}
                gradient="from-purple-500 to-purple-600"
                bgGradient="from-purple-50 to-purple-100"
                description="Stock & movement reports"
              />
            )}
          </>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
            {isCurrentUserAdmin() ? "Admin Actions" : 
             (currentUser?.role === 'staff' || currentUser?.role === 'Staff') ? "Staff Actions" : "Available Actions"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Admin sees all actions */}
            {isCurrentUserAdmin() && (
              <>
                <Link href="/inventory/add-item" className="group">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 group-hover:shadow-md">
                    <Package className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Add Item</h4>
                    <p className="text-sm text-gray-600">Create new inventory</p>
                  </div>
                </Link>
                <Link href="/reports/stock-movement" className="group">
                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-200 group-hover:shadow-md">
                    <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View Reports</h4>
                    <p className="text-sm text-gray-600">Stock movement analysis</p>
                  </div>
                </Link>
                <Link href="/users/add-user" className="group">
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 group-hover:shadow-md">
                    <Plus className="h-8 w-8 text-purple-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Add User</h4>
                    <p className="text-sm text-gray-600">Create new account</p>
                  </div>
                </Link>
                <Link href="/item-history" className="group">
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 group-hover:shadow-md">
                    <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View History</h4>
                    <p className="text-sm text-gray-600">Transaction records</p>
                  </div>
                </Link>

              </>
            )}

                        {/* Staff sees permission-based actions */}
            {(currentUser?.role === 'staff' || currentUser?.role === 'Staff') && !isCurrentUserAdmin() && (
              <>

                {/* Default staff actions - always show these for staff users */}
                <Link href="/inventory/view-items" className="group">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 group-hover:shadow-md">
                    <Package className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View Inventory</h4>
                    <p className="text-sm text-gray-600">Browse items in stock</p>
                  </div>
                </Link>
                <Link href="/inventory/add-item" className="group">
                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-200 group-hover:shadow-md">
                    <Plus className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Add Item</h4>
                    <p className="text-sm text-gray-600">Create new inventory</p>
                  </div>
                </Link>
                <Link href="/item-history" className="group">
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 group-hover:shadow-md">
                    <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View History</h4>
                    <p className="text-sm text-gray-600">Transaction records</p>
                  </div>
                </Link>
                <Link href="/reports/low-stock" className="group">
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 group-hover:shadow-md">
                    <AlertTriangle className="h-8 w-8 text-purple-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Low Stock Report</h4>
                    <p className="text-sm text-gray-600">Check items needing restock</p>
                  </div>
                </Link>
                <Link href="/reports/stock-movement" className="group">
                  <div className="p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all duration-200 group-hover:shadow-md">
                    <TrendingUp className="h-8 w-8 text-indigo-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Stock Movement</h4>
                    <p className="text-sm text-gray-600">Movement analysis</p>
                  </div>
                </Link>
              </>
            )}

            {/* Viewer sees read-only actions - only show if explicitly viewer role */}
            {currentUser?.role === 'viewer' && !isCurrentUserAdmin() && (
              <>
                {/* Default viewer actions - read-only access */}
                <Link href="/inventory/view-items" className="group">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 group-hover:shadow-md">
                    <Package className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View Inventory</h4>
                    <p className="text-sm text-gray-600">Browse items in stock</p>
                  </div>
                </Link>
                <Link href="/item-history" className="group">
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 group-hover:shadow-md">
                    <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View History</h4>
                    <p className="text-sm text-gray-600">Transaction records</p>
                  </div>
                </Link>
                <Link href="/reports/low-stock" className="group">
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 group-hover:shadow-md">
                    <AlertTriangle className="h-8 w-8 text-purple-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Low Stock Report</h4>
                    <p className="text-sm text-gray-600">Check items needing restock</p>
                  </div>
                </Link>
                <Link href="/reports/stock-movement" className="group">
                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-200 group-hover:shadow-md">
                    <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Stock Movement</h4>
                    <p className="text-sm text-gray-600">Movement analysis</p>
                  </div>
                </Link>
              </>
            )}
            
            {/* Fallback for any user that doesn't match above conditions */}
            {currentUser && !isCurrentUserAdmin() && currentUser?.role !== 'staff' && currentUser?.role !== 'Staff' && currentUser?.role !== 'viewer' && (
              <>
                <Link href="/inventory/view-items" className="group">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 group-hover:shadow-md">
                    <Package className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View Inventory</h4>
                    <p className="text-sm text-gray-600">Browse items in stock</p>
                  </div>
                </Link>
                <Link href="/item-history" className="group">
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:border-orange-300 transition-all duration-200 group-hover:shadow-md">
                    <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                    <h4 className="font-medium text-gray-900">View History</h4>
                    <p className="text-sm text-gray-600">Transaction records</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* System Status Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">Database</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">API Server</span>
              </div>
              <span className="text-sm text-blue-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-900">Permissions</span>
              </div>
              <span className="text-sm text-purple-600 font-medium">Active</span>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}

interface DashboardCardProps {
  title: string
  value: string
  link: string
  icon: React.ReactNode
  gradient: string
  bgGradient: string
  description: string
}

function DashboardCard({ title, value, link, icon, gradient, bgGradient, description }: DashboardCardProps) {
  return (
    <Link href={link} className="group">
      <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 transform group-hover:scale-[1.02]`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-r ${gradient} rounded-xl shadow-lg`}>
            <div className="text-white">{icon}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="flex items-center text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
          View details
          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}


