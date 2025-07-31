"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2, 
  User, 
  Shield, 
  Settings, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Plus,
  Edit,
  Trash,
  FileText,
  BarChart3,
  Package,
  Users as UsersIcon,
  Zap,
  Lock,
  Unlock,
  Copy,
  Info
} from "lucide-react"
import tauriApiService from "@/components/services/tauriApiService"

interface User {
  id: string | number
  firstName?: string
  lastName?: string
  first_name?: string
  last_name?: string
  firstname?: string
  lastname?: string
  username: string
  email?: string
  password?: string
  role: string
  permissions?: any
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

interface UpdateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess?: () => void
}

interface PermissionModule {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  actions: {
    id: string
    label: string
    description: string
    critical?: boolean
  }[]
}

const permissionModules: PermissionModule[] = [
  {
    id: "users",
    name: "User Management",
    description: "Manage system users and their access",
    icon: <UsersIcon className="h-4 w-4" />,
    color: "bg-blue-50 border-blue-200",
    actions: [
      { id: "view", label: "View Users", description: "Can view user list and details" },
      { id: "create", label: "Create Users", description: "Can create new users", critical: true },
      { id: "edit", label: "Edit Users", description: "Can modify user information", critical: true },
      { id: "delete", label: "Delete Users", description: "Can remove users from system", critical: true }
    ]
  },
  {
    id: "supplies",
    name: "Inventory Management",
    description: "Manage office supplies and stock",
    icon: <Package className="h-4 w-4" />,
    color: "bg-green-50 border-green-200",
    actions: [
      { id: "view", label: "View Supplies", description: "Can view inventory items" },
      { id: "create", label: "Add Supplies", description: "Can add new items to inventory" },
      { id: "edit", label: "Edit Supplies", description: "Can modify item details and stock" },
      { id: "delete", label: "Delete Supplies", description: "Can remove items from inventory" }
    ]
  },
  {
    id: "supply_histories",
    name: "Stock History",
    description: "Track stock movements and history",
    icon: <BarChart3 className="h-4 w-4" />,
    color: "bg-purple-50 border-purple-200",
    actions: [
      { id: "view", label: "View History", description: "Can view stock movement history" },
      { id: "create", label: "Record Movements", description: "Can record stock in/out transactions" },
      { id: "edit", label: "Edit History", description: "Can modify historical records" },
      { id: "delete", label: "Delete Records", description: "Can remove historical entries" }
    ]
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    description: "Generate and view system reports",
    icon: <FileText className="h-4 w-4" />,
    color: "bg-orange-50 border-orange-200",
    actions: [
      { id: "view", label: "View Reports", description: "Can access and view all reports" }
    ]
  }
]

// Predefined permission templates
const permissionTemplates = {
  admin: {
    name: "Admin",
    description: "Full system access with all permissions",
    permissions: {
      users: ["view", "create", "edit", "delete"],
      supplies: ["view", "create", "edit", "delete"],
      supply_histories: ["view", "create", "edit", "delete"],
      reports: ["view"]
    }
  },
  staff: {
    name: "Staff",
    description: "Operational access for daily tasks",
    permissions: {
      supplies: ["view", "create", "edit"],
      supply_histories: ["view", "create"],
      reports: ["view"]
    }
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to view data",
    permissions: {
      supplies: ["view"],
      supply_histories: ["view"],
      reports: ["view"]
    }
  }
}

export function UpdateUserDialog({ open, onOpenChange, user, onSuccess }: UpdateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    role: "",
  })
  const [selectedPermissions, setSelectedPermissions] = useState<{[key: string]: string[]}>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const { toast } = useToast()

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || user.first_name || user.firstname || "",
        lastName: user.lastName || user.last_name || user.lastname || "",
        username: user.username || "",
        email: user.email || "",
        role: user.role || "",
      })

      // Handle permissions from the new system
      if (user.permissions) {
        try {
          if (typeof user.permissions === 'string') {
            const parsedPermissions = JSON.parse(user.permissions)
            setSelectedPermissions(parsedPermissions)
          } else if (typeof user.permissions === 'object') {
            setSelectedPermissions(user.permissions)
          } else {
            setSelectedPermissions({})
          }
        } catch (error) {
          console.error('Error parsing permissions:', error)
          setSelectedPermissions({})
        }
      } else {
        setSelectedPermissions({})
      }
      
      setSelectedTemplate("")
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const handleModuleToggle = (module: string, checked: boolean) => {
    if (checked) {
      // Add all actions for the module
      const moduleActions = permissionModules.find(m => m.id === module)?.actions.map(a => a.id) || []
      setSelectedPermissions(prev => ({
        ...prev,
        [module]: moduleActions
      }))
    } else {
      // Remove all actions for the module
      setSelectedPermissions(prev => {
        const newPermissions = { ...prev }
        delete newPermissions[module]
        return newPermissions
      })
    }
  }

  const handleTemplateSelect = (templateKey: string) => {
    if (templateKey === "custom") {
      // If there are existing permissions, ask for confirmation
      if (Object.keys(selectedPermissions).length > 0) {
        const confirmed = window.confirm(
          "Switching to custom mode will clear all existing permissions. Are you sure you want to continue?"
        )
        if (!confirmed) {
          return
        }
      }
      setSelectedTemplate("custom")
      setSelectedPermissions({}) // Clear all permissions for custom template
      return
    }
    
    const template = permissionTemplates[templateKey as keyof typeof permissionTemplates]
    if (template) {
      setSelectedPermissions(template.permissions)
      setSelectedTemplate(templateKey)
      setFormData(prev => ({ ...prev, role: templateKey }))
    }
  }

  const clearAllPermissions = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all permissions? This action cannot be undone."
    )
    if (confirmed) {
      setSelectedPermissions({})
      setSelectedTemplate("custom")
    }
  }

  const getModuleStatus = (module: string) => {
    const moduleActions = permissionModules.find(m => m.id === module)?.actions || []
    const selectedActions = selectedPermissions[module] || []
    
    if (selectedActions.length === 0) return "none"
    if (selectedActions.length === moduleActions.length) return "all"
    return "partial"
  }

  const getTotalPermissions = () => {
    return Object.values(selectedPermissions).flat().length
  }

  const getCriticalPermissions = () => {
    let count = 0
    Object.entries(selectedPermissions).forEach(([module, actions]) => {
      const moduleDef = permissionModules.find(m => m.id === module)
      if (moduleDef) {
        count += actions.filter(action => 
          moduleDef.actions.find(a => a.id === action)?.critical
        ).length
      }
    })
    return count
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.username || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
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
      // Make API request
      const response = await tauriApiService.updateUser(user.id.toString(), {
        firstname: formData.firstName,
        lastname: formData.lastName,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        permissions: JSON.stringify(selectedPermissions),
      })

      if (response) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })

        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        throw new Error("Failed to update user")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-[#b12025] to-[#8a1a1f] text-white p-6 rounded-t-lg">
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center space-x-2">
            <User className="h-5 w-5" />
            <span>Update User Profile</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="basic" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Permissions</span>
                  {getTotalPermissions() > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 text-xs">
                      {getTotalPermissions()}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center space-x-2">
                  <Copy className="h-4 w-4" />
                  <span>Templates</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* User Avatar and Basic Info */}
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formData.firstName} {formData.lastName}
                    </h3>
                    <p className="text-gray-600">User ID: {user.id}</p>
                  </div>
                </div>

                {/* Basic Information Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">First Name</Label>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      placeholder="Enter first name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Username</Label>
                  <Input 
                    name="username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="Enter username"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input 
                    name="email" 
                    type="email"
                    value={formData.email} 
                    onChange={handleChange} 
                    className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="Enter email address"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                {/* Permissions Overview */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900 flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Permissions Summary
                      </div>
                      {getTotalPermissions() > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllPermissions}
                          className="text-xs h-auto py-1 border-red-300 hover:bg-red-50 text-red-600"
                        >
                          Clear All
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-blue-700">
                          Total permissions: <strong>{getTotalPermissions()}</strong>
                        </span>
                        <span className="text-sm text-blue-700">
                          Critical permissions: <strong className="text-red-600">{getCriticalPermissions()}</strong>
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {Object.keys(selectedPermissions).length} modules
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Permission Modules */}
                <div className="space-y-4">
                  {permissionModules.map((module) => {
                    const moduleStatus = getModuleStatus(module.id)
                    const selectedActions = selectedPermissions[module.id] || []
                    
                    return (
                      <Card key={module.id} className={`border-gray-200 ${module.color}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                {module.icon}
                              </div>
                              <div>
                                <CardTitle className="text-base font-medium">{module.name}</CardTitle>
                                <CardDescription className="text-sm">{module.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={moduleStatus === "all"}
                                onCheckedChange={(checked) => handleModuleToggle(module.id, checked as boolean)}
                              />
                              <Badge 
                                variant="secondary" 
                                className={
                                  moduleStatus === "all" ? "bg-green-100 text-green-800" :
                                  moduleStatus === "partial" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-600"
                                }
                              >
                                {selectedActions.length}/{module.actions.length}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {module.actions.map((action) => (
                              <div key={action.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <Checkbox
                                  id={`${module.id}-${action.id}`}
                                  checked={selectedActions.includes(action.id)}
                                  onCheckedChange={() => handlePermissionToggle(module.id, action.id)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <label 
                                      htmlFor={`${module.id}-${action.id}`} 
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {action.label}
                                    </label>
                                    {action.critical && (
                                      <Badge variant="destructive" className="text-xs">
                                        Critical
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{action.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Copy className="h-5 w-5 text-purple-600" />
                      <span>Permission Templates</span>
                    </CardTitle>
                    <CardDescription>
                      Choose from predefined permission templates or create custom permissions
                    </CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionTemplates).map(([key, template]) => (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => handleTemplateSelect(key)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {selectedTemplate === key && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(template.permissions).map(([module, actions]) => (
                            <div key={module} className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">{module.replace('_', ' ')}</span>
                              <Badge variant="secondary" className="text-xs">
                                {actions.length} permissions
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate === 'custom' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleTemplateSelect('custom')}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Custom</CardTitle>
                        {selectedTemplate === 'custom' && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <CardDescription>Start fresh with manual permission configuration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Settings className="h-4 w-4" />
                        <span>Clears all existing permissions</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedTemplate && selectedTemplate !== 'custom' && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">
                          Template "{permissionTemplates[selectedTemplate as keyof typeof permissionTemplates]?.name}" selected. 
                          Switch to "Permissions" tab to review or modify the permissions.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedTemplate === 'custom' && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Custom mode selected. All permissions have been cleared. 
                          Switch to "Permissions" tab to manually configure permissions.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                {/* Preview Card */}
                <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span>User Profile Preview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* User Info Preview */}
                    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {formData.firstName} {formData.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">@{formData.username}</p>
                        <p className="text-sm text-gray-500">{formData.email}</p>
                        <Badge variant="outline" className="mt-1">
                          {formData.role || 'No role selected'}
                        </Badge>
                      </div>
                    </div>

                    {/* Permissions Preview */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Assigned Permissions</h5>
                      {Object.keys(selectedPermissions).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(selectedPermissions).map(([module, actions]) => (
                            <div key={module} className="p-3 bg-white rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 capitalize">
                                  {module.replace('_', ' ')}
                                </span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {actions.length} permissions
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {actions.map((action) => (
                                  <Badge key={action} variant="outline" className="text-xs">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">No permissions selected</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Security Warning */}
                    {getCriticalPermissions() > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800">
                            Warning: This user has {getCriticalPermissions()} critical permissions that grant significant system access.
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="px-6"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#b12025] hover:bg-[#8a1a1f] px-6" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update User
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

