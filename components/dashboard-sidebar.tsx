"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Package, 
  FileText, 
  PieChart, 
  Users, 
  ChevronDown, 
  Menu, 
  Power, 
  Home,
  Settings,
  LogOut,
  User
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser, hasPermission } from "@/lib/permissions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  id: string | number
  username: string
  firstname: string
  lastname: string
  email: string
  role: string
  permissions?: any
}

export default function DashboardSidebar() {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [isUsersOpen, setIsUsersOpen] = useState(false)
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Get user from localStorage on component mount
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      setUser(null)
      return
    }

    try {
      const userData = JSON.parse(userStr)
      if (userData && typeof userData === 'object' && userData.username) {
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    }
  }, [])

  // Set initial state based on current path
  useEffect(() => {
    if (pathname?.startsWith("/inventory")) {
      setIsInventoryOpen(true)
    }
    if (pathname?.startsWith("/users")) {
      setIsUsersOpen(true)
    }
    if (pathname?.startsWith("/reports")) {
      setIsReportsOpen(true)
    }
    if (pathname?.startsWith("/item-history")) {
      setIsHistoryOpen(true)
    }
  }, [pathname])

  const isRouteActive = (route: string) => pathname === route
  const isParentRouteActive = (routes: string[]) => routes.some((route) => pathname?.startsWith(route))

  const handleTabClick = (route: string) => {
    if (route === "/inventory") setIsInventoryOpen(!isInventoryOpen)
    if (route === "/users") setIsUsersOpen(!isUsersOpen)
    if (route === "/reports") setIsReportsOpen(!isReportsOpen)
    if (route === "/item-history") setIsHistoryOpen(!isHistoryOpen)
  }

  // Handle logout
  const handleLogout = () => {
    try {
      // Clear authentication data
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("user")
      localStorage.removeItem("token")

      // Redirect to login page
      router.push("/")
    } catch (error) {
      // Silently handle logout errors
    }
  }

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'staff':
      case 'employee':
      case 'manager':
      case 'product manager':
      case 'stock manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'viewer':
      case 'user':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      <motion.div 
        className="fixed left-0 top-0 z-40 h-screen w-80 bg-gray-600 text-white flex flex-col shadow-lg"
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
      >
        {/* Header */}
        <motion.div 
          className="flex h-24 items-center justify-between px-6 border-b border-white border-opacity-20 flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center space-x-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/ciscs-logo.png"
                alt="CICS Logo"
                width={72}
                height={72}
                className="w-18 h-18 object-contain"
                priority
              />
            </motion.div>
            <div className="min-w-0 flex-1">
              <motion.h1 
                className="font-bold text-xl text-white leading-tight"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                Office Supplies
              </motion.h1>
              <motion.p 
                className="text-sm text-gray-300"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                Stock Monitoring System
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.nav 
          className="flex-1 overflow-y-auto py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.div 
            className="px-4 space-y-2"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.6
                }
              }
            }}
          >
            {/* Dashboard */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 }
              }}
            >
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center px-3 py-2 rounded-xl transition-all duration-200 group",
                  isRouteActive("/dashboard") 
                    ? "bg-red-600 text-white shadow-lg" 
                    : "text-white hover:bg-red-600 hover:bg-opacity-80"
                )}
              >
                <Home className={cn(
                  "h-5 w-5 mr-3 transition-colors",
                  isRouteActive("/dashboard") ? "text-white" : "text-gray-300 group-hover:text-white"
                )} />
                <span className="font-medium">Dashboard</span>
              </Link>
            </motion.div>

            {/* Inventory */}
            {(user?.role === 'admin' || user?.role === 'staff' || hasPermission(user, 'supplies', 'view')) && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <motion.button
                  className={cn(
                    "flex w-full items-center px-3 py-2 rounded-xl transition-all duration-200 group",
                    isParentRouteActive(["/inventory"]) 
                      ? "bg-red-600 text-white shadow-lg" 
                      : "text-white hover:bg-red-600 hover:bg-opacity-80"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabClick("/inventory")}
                >
                  <Package className={cn(
                    "h-5 w-5 mr-3 transition-colors",
                    isParentRouteActive(["/inventory"]) ? "text-white" : "text-gray-300 group-hover:text-white"
                  )} />
                  <span className="font-medium flex-1 text-left">Inventory</span>
                  <motion.div
                    animate={{ rotate: isInventoryOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-colors",
                      isParentRouteActive(["/inventory"]) ? "text-white" : "text-gray-300"
                    )} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isInventoryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 pt-2 space-y-1">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Link
                            href="/inventory/view-items"
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                              isRouteActive("/inventory/view-items") 
                                ? "bg-red-600 text-white font-medium" 
                                : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                            )}
                          >
                            <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                            View Items
                          </Link>
                        </motion.div>

                        {(user?.role === 'admin' || user?.role === 'staff' || hasPermission(user, 'supplies', 'create')) && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Link
                              href="/inventory/add-item"
                              className={cn(
                                "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                                isRouteActive("/inventory/add-item") 
                                  ? "bg-red-600 text-white font-medium" 
                                  : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                              )}
                            >
                              <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                              Add Item
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Item History */}
            {(user?.role === 'admin' || user?.role === 'staff' || user?.role === 'viewer' || hasPermission(user, 'supply_histories', 'view')) && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <motion.button
                  className={cn(
                    "flex w-full items-center px-3 py-2 rounded-xl transition-all duration-200 group",
                    isParentRouteActive(["/item-history"]) 
                      ? "bg-red-600 text-white shadow-lg" 
                      : "text-white hover:bg-red-600 hover:bg-opacity-80"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabClick("/item-history")}
                >
                  <FileText className={cn(
                    "h-5 w-5 mr-3 transition-colors",
                    isParentRouteActive(["/item-history"]) ? "text-white" : "text-gray-300 group-hover:text-white"
                  )} />
                  <span className="font-medium flex-1 text-left">Item History</span>
                  <motion.div
                    animate={{ rotate: isHistoryOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-colors",
                      isParentRouteActive(["/item-history"]) ? "text-white" : "text-gray-300"
                    )} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isHistoryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 pt-2 space-y-1">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Link
                            href="/item-history"
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                              isRouteActive("/item-history") && !isRouteActive("/item-history/dashboard")
                                ? "bg-red-600 text-white font-medium" 
                                : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                            )}
                          >
                            <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                            All History
                          </Link>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Link
                            href="/item-history/dashboard"
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                              isRouteActive("/item-history/dashboard") 
                                ? "bg-red-600 text-white font-medium" 
                                : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                            )}
                          >
                            <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                            History Dashboard
                          </Link>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Reports */}
            {(user?.role === 'admin' || user?.role === 'staff' || user?.role === 'viewer' || hasPermission(user, 'reports', 'view')) && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <motion.button
                  className={cn(
                    "flex w-full items-center px-3 py-2 rounded-xl transition-all duration-200 group",
                    isParentRouteActive(["/reports"]) 
                      ? "bg-red-600 text-white shadow-lg" 
                      : "text-white hover:bg-red-600 hover:bg-opacity-80"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabClick("/reports")}
                >
                  <PieChart className={cn(
                    "h-5 w-5 mr-3 transition-colors",
                    isParentRouteActive(["/reports"]) ? "text-white" : "text-gray-300 group-hover:text-white"
                  )} />
                  <span className="font-medium flex-1 text-left">Reports</span>
                  <motion.div
                    animate={{ rotate: isReportsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-colors",
                      isParentRouteActive(["/reports"]) ? "text-white" : "text-gray-300"
                    )} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isReportsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 pt-2 space-y-1">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Link
                            href="/reports/low-stock"
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                              isRouteActive("/reports/low-stock") 
                                ? "bg-red-600 text-white font-medium" 
                                : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                            )}
                          >
                            <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                            Low Stock Report
                          </Link>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Link
                            href="/reports/stock-movement"
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                              isRouteActive("/reports/stock-movement") 
                                ? "bg-red-600 text-white font-medium" 
                                : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                            )}
                          >
                            <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                            Stock Movement
                          </Link>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Users - Only for Admin */}
            {(user?.role === 'admin' || hasPermission(user, "users", "view")) && (
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
              >
                <motion.button
                  className={cn(
                    "flex w-full items-center px-3 py-2 rounded-xl transition-all duration-200 group",
                    isParentRouteActive(["/users"]) 
                      ? "bg-red-600 text-white shadow-lg" 
                      : "text-white hover:bg-red-600 hover:bg-opacity-80"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabClick("/users")}
                >
                  <Users className={cn(
                    "h-5 w-5 mr-3 transition-colors",
                    isParentRouteActive(["/users"]) ? "text-white" : "text-gray-300 group-hover:text-white"
                  )} />
                  <span className="font-medium flex-1 text-left">Users</span>
                  <motion.div
                    animate={{ rotate: isUsersOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-colors",
                      isParentRouteActive(["/users"]) ? "text-white" : "text-gray-300"
                    )} />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isUsersOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 pt-2 space-y-1">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Link
                            href="/users/view-users"
                            className={cn(
                              "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                              isRouteActive("/users/view-users") 
                                ? "bg-red-600 text-white font-medium" 
                                : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                            )}
                          >
                            <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                            View Users
                          </Link>
                        </motion.div>

                        {(user?.role === 'admin' || hasPermission(user, "users", "create")) && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Link
                              href="/users/add-user"
                              className={cn(
                                "flex items-center px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                                isRouteActive("/users/add-user") 
                                  ? "bg-red-600 text-white font-medium" 
                                  : "text-gray-300 hover:bg-red-600 hover:bg-opacity-60 hover:text-white"
                              )}
                            >
                              <div className="w-1.5 h-1.5 bg-current rounded-full mr-3" />
                              Add User
                            </Link>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}


          </motion.div>
        </motion.nav>

        {/* User Profile Section */}
        <motion.div 
          className="border-t border-white border-opacity-20 p-4 flex-shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <motion.div 
            className="flex items-center space-x-3 p-4 bg-red-600 bg-opacity-20 rounded-xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {/* Enhanced User Avatar */}
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-white font-bold text-sm">
                {user?.firstname?.charAt(0)}{user?.lastname?.charAt(0)}
              </span>
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <motion.p 
                className="text-sm font-semibold text-white truncate"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                {user?.firstname} {user?.lastname}
              </motion.p>
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.3 }}
              >
                <Badge variant="outline" className={cn("text-xs bg-gray-600 text-gray-200 border-gray-500")}>
                  {user?.role || "User"}
                </Badge>
              </motion.div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutDialog(true)}
                className="h-8 w-8 text-gray-300 hover:text-red-400 hover:bg-red-900 hover:bg-opacity-20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

