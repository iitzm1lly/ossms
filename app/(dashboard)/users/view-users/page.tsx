"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UpdateUserDialog } from "@/components/update-user-dialog"
import { Search, Loader2, Users, UserPlus, Shield, Eye, Edit, Trash2, Filter, Calendar, Mail, User, Key, Clock, CheckCircle, XCircle, RefreshCw, FilterX, SortAsc, SortDesc } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import tauriApiService from "@/components/services/tauriApiService"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { getCurrentUser, hasPermission } from "@/lib/permissions"

interface User {
  id: string | number
  username: string
  firstname: string
  lastname: string
  email: string
  role: string
  permissions?: any
  created_at: string
  updated_at: string
}

interface FilterState {
  searchTerm: string
  selectedRole: string | "all"
  permissionLevel: string | "all" // Simplified: all, admin, staff, viewer
  sortBy: 'name' | 'role' | 'created_at' | 'email'
  sortOrder: 'asc' | 'desc'
  showOnlyAdmins: boolean
}

export default function ViewUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string | number>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedRole: "all",
    permissionLevel: "all",
    sortBy: 'name',
    sortOrder: 'asc',
    showOnlyAdmins: false
  })
  const { toast } = useToast()

  // Available roles for filtering
  const availableRoles = ['admin', 'staff', 'viewer']
  
  const getUsers = async () => {
    try {
      setIsLoading(true)
      const res = await tauriApiService.getUsers()
      if (res && Array.isArray(res)) {
        setUsers(res)
      } else {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getUsers()
  }, [])

  useEffect(() => {
    let filtered = [...users]

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (user) =>
          (user.username || '').toLowerCase().includes(searchLower) ||
          (user.firstname || '').toLowerCase().includes(searchLower) ||
          (user.lastname || '').toLowerCase().includes(searchLower) ||
          (user.email || '').toLowerCase().includes(searchLower) ||
          `${user.firstname || ''} ${user.lastname || ''}`.toLowerCase().includes(searchLower)
      )
    }

    // Role filter
    if (filters.selectedRole && filters.selectedRole !== "all") {
      filtered = filtered.filter((user) => (user.role || '').toLowerCase() === filters.selectedRole.toLowerCase())
    }

    // Permission filter
    if (filters.permissionLevel && filters.permissionLevel !== "all") {
      filtered = filtered.filter((user) => {
        if (!user.permissions) return false
        const userPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
        
        // Check if user has permissions for the selected level
        switch (filters.permissionLevel) {
          case 'admin':
            return userPerms.users && userPerms.users.includes('delete')
          case 'staff':
            return userPerms.supplies && userPerms.supplies.includes('create')
          case 'viewer':
            return userPerms.supplies && userPerms.supplies.includes('view') && 
                   (!userPerms.supplies.includes('create') && !userPerms.users)
          default:
            return true
        }
      })
    }

    // Admin filter
    if (filters.showOnlyAdmins) {
      filtered = filtered.filter((user) => isAdmin(user.role || ''))
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'name':
          aValue = `${a.firstname || ''} ${a.lastname || ''}`.toLowerCase().trim()
          bValue = `${b.firstname || ''} ${b.lastname || ''}`.toLowerCase().trim()
          break
        case 'role':
          aValue = (a.role || '').toLowerCase()
          bValue = (b.role || '').toLowerCase()
          break
        case 'email':
          aValue = (a.email || '').toLowerCase()
          bValue = (b.email || '').toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime()
          bValue = new Date(b.created_at || 0).getTime()
          break
        default:
          aValue = (a.firstname || '').toLowerCase()
          bValue = (b.firstname || '').toLowerCase()
      }

      // Handle null/undefined values
      if (!aValue && !bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredUsers(filtered)
  }, [users, filters])

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const res = await tauriApiService.deleteUser(userToDelete.id.toString())
      if (res) {
        toast({
          title: "User deleted",
          description: "User has been deleted successfully.",
        })
        getUsers()
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const formatPermissions = (permissions: any) => {
    if (!permissions) return "No permissions"
    
    try {
      const perms = typeof permissions === 'string' ? JSON.parse(permissions) : permissions
      const modules = Object.keys(perms)
      return modules.map(module => 
        `${module}: ${perms[module].join(', ')}`
      ).join('; ')
    } catch {
      return "Invalid permissions format"
    }
  }

  const getRoleDisplay = (role: string) => {
    if (!role) return "Unknown"
    
    const roleLower = role.toLowerCase()
    switch (roleLower) {
      case "admin":
      case "administrator":
        return "Admin"
      case "staff":
      case "employee":
      case "manager":
      case "product manager":
      case "stock manager":
        return "Staff"
      case "viewer":
      case "user":
        return "Viewer"
      default:
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    }
  }

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase()
    switch (roleLower) {
      case "admin":
      case "administrator":
        return "bg-red-100 text-red-800 border-red-200"
      case "staff":
      case "employee":
      case "manager":
      case "product manager":
      case "stock manager":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "viewer":
      case "user":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Helper function to check if user is admin
  const isAdmin = (role: string) => {
    if (!role) return false
    const roleLower = role.toLowerCase()
    return roleLower === 'admin' || roleLower === 'administrator'
  }

  const getPermissionCount = (permissions: any) => {
    if (!permissions) return 0
    try {
      const perms = typeof permissions === 'string' ? JSON.parse(permissions) : permissions
      if (typeof perms === 'object' && perms !== null) {
        let totalCount = 0
        for (const [module, actions] of Object.entries(perms)) {
          if (Array.isArray(actions)) {
            // Standardize 'update' to 'edit'
            const standardized = actions.map(a => a === 'update' ? 'edit' : a)
            // For 'reports', only count 'view'
            if (module === 'reports') {
              totalCount += standardized.filter(a => a === 'view').length
            } else {
              totalCount += standardized.length
            }
          }
        }
        return totalCount
      }
    } catch (error) {
      return 0
    }
    return 0
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewOpen(true)
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      selectedRole: "all",
      permissionLevel: "all",
      sortBy: 'name',
      sortOrder: 'asc',
      showOnlyAdmins: false
    })
    setIsFilterOpen(false)
  }

  const applyFilters = () => {
    // Filters are applied automatically via useEffect, just close the sheet
    setIsFilterOpen(false)
  }

  const hasActiveFilters = () => {
    return filters.searchTerm || 
           (filters.selectedRole && filters.selectedRole !== "all") || 
           (filters.permissionLevel && filters.permissionLevel !== "all") || 
           filters.showOnlyAdmins
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string | number, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return
    setBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedUsers).map(userId => 
        tauriApiService.deleteUser(userId.toString())
      )
      
      await Promise.all(deletePromises)
      
      toast({
        title: "Users deleted",
        description: `${selectedUsers.size} user(s) have been deleted successfully.`,
      })
      
      setSelectedUsers(new Set())
      getUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete some users",
        variant: "destructive",
      })
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: 1, // Current user only - no session tracking implemented
    adminUsers: users.filter(user => isAdmin(user.role)).length,
    regularUsers: users.filter(user => !isAdmin(user.role)).length,
    filteredUsers: filteredUsers.length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-4">
      {/* Header Section */}
              <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live System</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={getUsers}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            <p className="text-sm text-gray-600 mt-2">Registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Online Users</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlus className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
            <p className="text-sm text-gray-600 mt-2">Currently online</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Admin Users</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.adminUsers}</div>
            <p className="text-sm text-gray-600 mt-2">Administrators</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Regular Users</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.regularUsers}</div>
            <p className="text-sm text-gray-600 mt-2">Standard users</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Filtered Results</CardTitle>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Filter className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.filteredUsers}</div>
            <p className="text-sm text-gray-600 mt-2">Showing results</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search users by name, username, or email..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-white/50 border-gray-200 hover:bg-white/80">
                <Filter size={16} />
                Filter
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-96">
              <SheetHeader>
                <SheetTitle>Filter Users</SheetTitle>
                <SheetDescription>Filter users by role, permissions, and other criteria.</SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-6">
                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={filters.selectedRole}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, selectedRole: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                                         <SelectContent>
                       <SelectItem value="all">All Roles</SelectItem>
                       {availableRoles.map(role => (
                         <SelectItem key={role} value={role}>
                           {getRoleDisplay(role)}
                         </SelectItem>
                       ))}
                     </SelectContent>
                  </Select>
                </div>

                {/* Permission Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Permission Level</label>
                  <Select
                    value={filters.permissionLevel}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, permissionLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Permission Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Permission Levels</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin-only"
                    checked={filters.showOnlyAdmins}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showOnlyAdmins: checked as boolean }))}
                  />
                  <label htmlFor="admin-only" className="text-sm cursor-pointer">
                    Show only administrators
                  </label>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="role">Role</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="created_at">Created Date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                      }))}
                      className="flex items-center gap-1"
                    >
                      {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      {filters.sortOrder === 'asc' ? 'Asc' : 'Desc'}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    onClick={clearFilters} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button className="flex-1 bg-[#b12025] hover:bg-[#8a1a1f]" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {hasActiveFilters() && (
            <Button 
              onClick={() => {
                clearFilters()
                setIsFilterOpen(false)
              }}
              variant="outline" 
              className="bg-white/50 border-gray-200 hover:bg-white/80"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#4c4a4a]" />
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {selectedUsers.size} selected
                    </Badge>
                    <span className="text-sm text-gray-600">users selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasPermission(getCurrentUser(), 'users', 'delete') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUsers(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-900">User</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Username</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Email</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Role</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Permissions</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Created</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#b12025] to-[#8a1a1f] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.firstname.charAt(0)}{user.lastname.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.firstname} {user.lastname}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{user.username}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{user.email}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {getRoleDisplay(user.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          {user.permissions ? (
                            <div className="text-xs text-gray-500">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {getPermissionCount(user.permissions)} permissions
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No permissions</span>
                          )}
                        </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-1 border-blue-300 hover:bg-blue-50 text-blue-600"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                            {(hasPermission(getCurrentUser(), 'users', 'edit')) && (
                              <Button
                                className="text-white text-xs px-3 py-1 h-auto bg-[#b12025] hover:bg-[#8a1a1f]"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsUpdateOpen(true)
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                            {(hasPermission(getCurrentUser(), 'users', 'delete')) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-1 border-red-300 hover:bg-red-50 text-red-600"
                                onClick={() => handleDeleteUser(user)}
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
                    <td colSpan={8} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-600">
                          {hasActiveFilters()
                            ? "No users found matching your filters"
                            : "No users available"}
                        </p>
                        {hasActiveFilters() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="mt-2"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View User Dialog */}
      {selectedUser && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-[#b12025]" />
                <span>User Details</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* User Avatar and Basic Info */}
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-[#b12025] to-[#8a1a1f] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedUser.firstname.charAt(0)}{selectedUser.lastname.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedUser.firstname} {selectedUser.lastname}
                  </h3>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Username:</span>
                      <span className="font-medium">{selectedUser.username}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Role:</span>
                      <Badge variant="outline" className={getRoleColor(selectedUser.role)}>
                        {getRoleDisplay(selectedUser.role)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-600">Permissions:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {getPermissionCount(selectedUser.permissions)} total
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Updated:</span>
                      <span className="font-medium">
                        {new Date(selectedUser.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Permissions Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-blue-900 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Permissions ({getPermissionCount(selectedUser.permissions)} total)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedUser.permissions ? (
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {getPermissionCount(selectedUser.permissions)} permissions assigned
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Use the Edit button to modify permissions
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <XCircle className="h-4 w-4" />
                      <span>No permissions assigned</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewOpen(false)
                    setIsUpdateOpen(true)
                  }}
                  className="bg-[#b12025] hover:bg-[#8a1a1f]"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Update User Dialog */}
                  {selectedUser && (hasPermission(getCurrentUser(), 'users', 'edit')) && (
        <UpdateUserDialog
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          user={selectedUser}
          onSuccess={getUsers}
        />
      )}

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">Delete User</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Are you sure you want to delete <strong>"{userToDelete?.firstname} {userToDelete?.lastname}"</strong>? 
              <br />
              This action cannot be undone and will permanently remove the user account.
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
              onClick={confirmDeleteUser}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">Delete Multiple Users</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Are you sure you want to delete <strong>{selectedUsers.size} user{selectedUsers.size === 1 ? '' : 's'}</strong>? 
              <br />
              This action cannot be undone and will permanently remove all selected user accounts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setBulkDeleteDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedUsers.size} User{selectedUsers.size === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

