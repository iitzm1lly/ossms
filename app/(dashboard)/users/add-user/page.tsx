"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus, Shield, Eye, Edit, Trash2, Plus, Check, AlertCircle } from "lucide-react"
import tauriApiService from "@/components/services/tauriApiService"

interface PermissionModule {
  name: string
  label: string
  icon: React.ReactNode
  actions: { value: string; label: string; icon: React.ReactNode }[]
  description: string
}

const permissionModules: PermissionModule[] = [
  {
    name: "users",
    label: "User Management",
    icon: <UserPlus className="h-4 w-4" />,
    description: "Manage system users and their permissions",
    actions: [
      { value: "view", label: "View Users", icon: <Eye className="h-3 w-3" /> },
      { value: "create", label: "Create Users", icon: <Plus className="h-3 w-3" /> },
      { value: "edit", label: "Edit Users", icon: <Edit className="h-3 w-3" /> },
      { value: "delete", label: "Delete Users", icon: <Trash2 className="h-3 w-3" /> },
    ]
  },
  {
    name: "supplies",
    label: "Inventory Management",
    icon: <Shield className="h-4 w-4" />,
    description: "Manage office supplies and inventory",
    actions: [
      { value: "view", label: "View Supplies", icon: <Eye className="h-3 w-3" /> },
      { value: "create", label: "Add Supplies", icon: <Plus className="h-3 w-3" /> },
      { value: "edit", label: "Edit Supplies", icon: <Edit className="h-3 w-3" /> },
      { value: "delete", label: "Delete Supplies", icon: <Trash2 className="h-3 w-3" /> },
    ]
  },
  {
    name: "supply_histories",
    label: "Transaction History",
    icon: <Eye className="h-4 w-4" />,
    description: "View and manage supply transactions",
    actions: [
      { value: "view", label: "View History", icon: <Eye className="h-3 w-3" /> },
      { value: "create", label: "Create Records", icon: <Plus className="h-3 w-3" /> },
      { value: "edit", label: "Edit Records", icon: <Edit className="h-3 w-3" /> },
      { value: "delete", label: "Delete Records", icon: <Trash2 className="h-3 w-3" /> },
    ]
  },
  {
    name: "reports",
    label: "Reports & Analytics",
    icon: <Shield className="h-4 w-4" />,
    description: "Access system reports and analytics",
    actions: [
      { value: "view", label: "View Reports", icon: <Eye className="h-3 w-3" /> },
    ]
  }
]

const rolePresets = {
  "Admin": {
    label: "Admin",
    description: "Full system access with all permissions",
    color: "bg-red-100 text-red-800 border-red-200",
    permissions: {
      users: ["view", "create", "edit", "delete"],
      supplies: ["view", "create", "edit", "delete"],
      supply_histories: ["view", "create", "edit", "delete"],
      reports: ["view"]
    }
  },
  "Staff": {
    label: "Staff",
    description: "Operational access for daily tasks",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    permissions: {
      supplies: ["view", "create", "edit"],
      supply_histories: ["view", "create"],
      reports: ["view"]
    }
  },
  "Viewer": {
    label: "Viewer",
    description: "Read-only access to view data",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    permissions: {
      supplies: ["view"],
      supply_histories: ["view"],
      reports: ["view"]
    }
  },
  "Custom": {
    label: "Custom Role",
    description: "Customize permissions as needed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    permissions: {}
  }
}

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    role: "Staff",
  })
  const [selectedPermissions, setSelectedPermissions] = useState<{[key: string]: string[]}>(rolePresets.Staff.permissions)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role }))
    if (role !== "Custom") {
      setSelectedPermissions(rolePresets[role as keyof typeof rolePresets].permissions)
    } else {
      // Clear all permissions when Custom role is selected
      setSelectedPermissions({})
    }
  }

  const handlePermissionToggle = (module: string, action: string) => {
    setSelectedPermissions(prev => {
      const newPermissions = { ...prev }
      if (!newPermissions[module]) {
        newPermissions[module] = []
      }
      
      const actions = newPermissions[module]
      if (actions.includes(action)) {
        newPermissions[module] = actions.filter(a => a !== action)
      } else {
        newPermissions[module] = [...actions, action]
      }
      
      // Remove empty modules
      if (newPermissions[module].length === 0) {
        delete newPermissions[module]
      }
      
      return newPermissions
    })
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.firstname.trim()) newErrors.firstname = "First name is required"
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required"
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.password.trim()) newErrors.password = "Password is required"
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    // Username validation
    if (formData.username && formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    if (Object.keys(selectedPermissions).length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one permission",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await tauriApiService.createUser({
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        permissions: JSON.stringify(selectedPermissions),
      })

      if (response) {
        toast({
          title: "Success!",
          description: "User has been created successfully",
        })
        router.push("/users/view-users")
      } else {
        throw new Error("Failed to add user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      firstname: "",
      lastname: "",
      username: "",
      email: "",
      password: "",
      role: "Staff",
    })
    setSelectedPermissions(rolePresets.Staff.permissions)
    setErrors({})
  }

  const getSelectedRoleInfo = () => {
    return rolePresets[formData.role as keyof typeof rolePresets]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d5d3b8] via-[#e8e6d0] to-[#f0eed8] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New User</h1>
            <p className="text-gray-600">Create a new user account with appropriate permissions</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live System</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>User Information</span>
              </CardTitle>
              <CardDescription>
                Enter the basic information for the new user account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={errors.firstname ? "border-red-500" : ""}
                  />
                  {errors.firstname && (
                    <p className="text-sm text-red-500 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.firstname}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-sm font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={errors.lastname ? "border-red-500" : ""}
                  />
                  {errors.lastname && (
                    <p className="text-sm text-red-500 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.lastname}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className={errors.username ? "border-red-500" : ""}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.username}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(rolePresets).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={role.color}>
                              {role.label}
                            </Badge>
                            <span className="text-sm text-gray-600">{role.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Permissions</span>
              </CardTitle>
              <CardDescription>
                Configure what this user can access and modify in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {permissionModules.map((module) => (
                  <div key={module.name} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-blue-100 rounded">
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{module.label}</h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {module.actions.map((action) => (
                        <div key={action.value} className="flex items-center space-x-3">
                          <Checkbox
                            id={`${module.name}-${action.value}`}
                            checked={selectedPermissions[module.name]?.includes(action.value) || false}
                            onCheckedChange={() => handlePermissionToggle(module.name, action.value)}
                          />
                          <Label 
                            htmlFor={`${module.name}-${action.value}`} 
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <div className="p-1 bg-gray-100 rounded">
                              {action.icon}
                            </div>
                            <span className="text-sm font-medium">{action.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-8"
            >
              Reset Form
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

