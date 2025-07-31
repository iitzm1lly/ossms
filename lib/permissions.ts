// Permission checking utilities
export interface UserPermissions {
  users?: string[]
  supplies?: string[]
  supply_histories?: string[]
  reports?: string[]
}

export interface User {
  id: string | number
  username: string
  role: string
  permissions?: UserPermissions
}

// Route to permission mapping
export const routePermissions: Record<string, { module: string; action: string }> = {
  '/users/view-users': { module: 'users', action: 'view' },
  '/users/add-user': { module: 'users', action: 'create' },
  '/inventory/view-items': { module: 'supplies', action: 'view' },
  '/inventory/add-item': { module: 'supplies', action: 'create' },
  '/item-history': { module: 'supply_histories', action: 'view' },
  '/reports/low-stock': { module: 'reports', action: 'view' },
  '/reports/stock-movement': { module: 'reports', action: 'view' },
}

// Check if user has permission for a specific module and action
export function hasPermission(user: User | null, module: string, action: string): boolean {
  if (!user) return false
  
  // Admin override - admin users should have access to everything
  if (user.role === 'admin' || user.username === 'admin') {
    return true
  }
  
  // Staff role override - if user has staff role but no permissions, assign default staff permissions
  if (user.role === 'staff' && (!user.permissions || Object.keys(user.permissions).length === 0)) {
    const defaultStaffPermissions = {
      supplies: ["view", "create", "edit"],
      supply_histories: ["view", "create"],
      reports: ["view"]
    };
    
    const modulePermissions = defaultStaffPermissions[module as keyof typeof defaultStaffPermissions];
    if (!modulePermissions) return false;
    
    return modulePermissions.includes(action);
  }
  
  if (!user.permissions) return false
  
  const modulePermissions = user.permissions[module as keyof UserPermissions]
  if (!modulePermissions) return false
  
  return modulePermissions.includes(action)
}

// Check if user can access a specific route
export function canAccessRoute(user: User | null, route: string): boolean {
  const requiredPermission = routePermissions[route]
  if (!requiredPermission) return true // If no permission required, allow access
  
  return hasPermission(user, requiredPermission.module, requiredPermission.action)
}

// Get user from localStorage
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    
    const user = JSON.parse(userStr)
    return user
  } catch (error) {
    return null
  }
} 