import { mockItems, mockItemHistory, mockUsers } from "./mock-data"

// Fixed threshold values
const FIXED_THRESHOLDS = {
  LOW_BULK: 2,
  LOW_PCS: 24,
  MODERATE_BULK: 5,
  MODERATE_PCS: 60,
  HIGH_BULK: 10,
  HIGH_PCS: 120,
}

// Types
export interface Item {
  id: number
  name: string
  unit_type: string
  bulk_quantity: number
  pieces_quantity: number
  pieces: number // Added for API compatibility
  created_at: string
  updated_at: string
  low_threshold_bulk: number
  low_threshold_pcs: number
  moderate_threshold_bulk: number
  moderate_threshold_pcs: number
  high_threshold_bulk: number
  high_threshold_pcs: number
  stock_status: string
  status?: string // Added for API compatibility
  description?: string
  category?: string
  subcategory?: string
  supplier_name?: string
  supplier_contact?: string
  supplier_notes?: string
  pieces_per_bulk?: number
  unit?: string // For backward compatibility
}

export interface ItemHistory {
  id: number
  item_id: number
  quantity: number
  pieces?: number // For API compatibility
  quantity_before: number // New field for tracking original quantity
  quantity_after: number // New field for tracking final quantity
  is_bulk: boolean
  action: "Stock In" | "Stock Out"
  reason: string
  user_id: string
  created_at: string
  item_name?: string
  performed_by?: string
  releaser?: string // For API compatibility (keeping for backward compatibility)
  name?: string // For API compatibility
}

export interface User {
  id: string
  first_name: string
  last_name: string
  username: string
  created_at: string
  updated_at: string
  roles: string[]
}

// In-memory store
class MockStore {
  private items: Item[] = []
  private itemHistory: ItemHistory[] = []
  private users: User[] = []
  private nextItemId = 1
  private nextHistoryId = 1

  constructor() {
    // Initialize with mock data
    this.items = JSON.parse(JSON.stringify(mockItems))

    // Add unit_type to existing items if it doesn't exist
    this.items = this.items.map((item) => ({
      ...item,
      unit_type: item.unit_type || "box", // Default to "box" for existing items
    }))

    this.itemHistory = JSON.parse(JSON.stringify(mockItemHistory))
    this.users = JSON.parse(JSON.stringify(mockUsers))

    // Set next IDs
    this.nextItemId = Math.max(...this.items.map((item) => item.id), 0) + 1
    this.nextHistoryId = Math.max(...this.itemHistory.map((history) => history.id), 0) + 1
  }

  // Item methods
  getItems(): Item[] {
    return this.items
  }

  getItem(id: number): Item | undefined {
    return this.items.find((item) => item.id === id)
  }

  addItem(item: Omit<Item, "id" | "created_at" | "updated_at">): Item {
    const now = new Date().toISOString()
    const newItem: Item = {
      id: this.nextItemId++,
      created_at: now,
      updated_at: now,
      ...item,
    }

    this.items.push(newItem)
    return newItem
  }

  updateItem(id: number, updates: Partial<Item>): Item | null {
    const index = this.items.findIndex((item) => item.id === id)
    if (index === -1) return null

    const updatedItem = {
      ...this.items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.items[index] = updatedItem
    return updatedItem
  }

  deleteItem(id: number): boolean {
    const initialLength = this.items.length
    this.items = this.items.filter((item) => item.id !== id)
    return this.items.length !== initialLength
  }

  // Update item stock and record history
  updateItemStock(
    itemId: number,
    addBulk = 0,
    addPieces = 0,
    releaseBulk = 0,
    releasePieces = 0,
    stockInReason = "",
    stockOutReason = "",
    userId = "user1",
  ): { success: boolean; item?: Item; error?: string } {
    const item = this.getItem(itemId)
    if (!item) return { success: false, error: "Item not found" }

    const now = new Date().toISOString()
    let updated = false

    // Process stock in
    if (addBulk > 0 || addPieces > 0) {
      const newBulk = item.bulk_quantity + addBulk
      const newPieces = item.pieces_quantity + addPieces

      // Add history record
      this.addItemHistory({
        item_id: itemId,
        quantity: addBulk > 0 ? addBulk : addPieces,
        is_bulk: addBulk > 0,
        action: "Stock In",
        reason: stockInReason,
        user_id: userId,
        item_name: item.name,
        releaser_name:
          this.users.find((u) => u.id === userId)?.first_name +
          " " +
          this.users.find((u) => u.id === userId)?.last_name,
      })

      // Update item
      item.bulk_quantity = newBulk
      item.pieces_quantity = newPieces
      updated = true
    }

    // Process stock out
    if (releaseBulk > 0 || releasePieces > 0) {
      // Check if we have enough stock
      if (releaseBulk > item.bulk_quantity || releasePieces > item.pieces_quantity) {
        return { success: false, error: "Not enough stock available" }
      }

      const newBulk = item.bulk_quantity - releaseBulk
      const newPieces = item.pieces_quantity - releasePieces

      // Add history record
      this.addItemHistory({
        item_id: itemId,
        quantity: releaseBulk > 0 ? releaseBulk : releasePieces,
        is_bulk: releaseBulk > 0,
        action: "Stock Out",
        reason: stockOutReason,
        user_id: userId,
        item_name: item.name,
        releaser_name:
          this.users.find((u) => u.id === userId)?.first_name +
          " " +
          this.users.find((u) => u.id === userId)?.last_name,
      })

      // Update item
      item.bulk_quantity = newBulk
      item.pieces_quantity = newPieces
      updated = true
    }

    if (updated) {
      // Update stock status using fixed thresholds
      if (item.bulk_quantity <= FIXED_THRESHOLDS.LOW_BULK || item.pieces_quantity <= FIXED_THRESHOLDS.LOW_PCS) {
        item.stock_status = "Low"
      } else if (
        item.bulk_quantity >= FIXED_THRESHOLDS.HIGH_BULK ||
        item.pieces_quantity >= FIXED_THRESHOLDS.HIGH_PCS
      ) {
        item.stock_status = "High"
      } else {
        item.stock_status = "Moderate"
      }

      item.updated_at = now
      return { success: true, item }
    }

    return { success: false, error: "No changes made" }
  }

  // Item history methods
  getItemHistory(): ItemHistory[] {
    return this.itemHistory
  }

  addItemHistory(history: Omit<ItemHistory, "id" | "created_at">): ItemHistory {
    const newHistory: ItemHistory = {
      id: this.nextHistoryId++,
      created_at: new Date().toISOString(),
      ...history,
    }

    this.itemHistory.push(newHistory)
    return newHistory
  }

  // User methods
  getUsers(): User[] {
    return this.users
  }

  getUser(id: string): User | undefined {
    return this.users.find((user) => user.id === id)
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find((user) => user.username === username)
  }

  addUser(user: Omit<User, "id" | "created_at" | "updated_at">): User {
    const now = new Date().toISOString()
    const newUser: User = {
      id: `user${this.users.length + 1}`,
      created_at: now,
      updated_at: now,
      ...user,
    }

    this.users.push(newUser)
    return newUser
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex((user) => user.id === id)
    if (index === -1) return null

    const updatedUser = {
      ...this.users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.users[index] = updatedUser
    return updatedUser
  }

  // Authentication methods
  authenticateUser(username: string, password: string): { success: boolean; user?: User; error?: string } {
    // For testing, accept any password for existing users
    const user = this.getUserByUsername(username)
    if (user) {
      return { success: true, user }
    }

    return { success: false, error: "Invalid username or password" }
  }
}

// Create a singleton instance
export const mockStore = new MockStore()

