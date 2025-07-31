// Check if we're running in Tauri environment - multiple detection methods
const isTauriAvailable = typeof window !== 'undefined' && (
  'Tauri' in window || 
  'Tauri' in (window as any) ||
  typeof (window as any).__TAURI__ !== 'undefined' ||
  typeof (window as any).__TAURI_INTERNALS__ !== 'undefined' ||
  typeof (window as any).__TAURI_RUNTIME__ !== 'undefined'
);

console.log('TauriApiService: isTauriAvailable =', isTauriAvailable);

// Types for Tauri API
interface User {
  id: string;
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  permissions: string | object;
  created_at: string;
  updated_at: string;
}

interface Supply {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  status: string;
  location?: string;
  supplier?: string;
  supplier_name?: string;
  supplier_contact?: string;
  supplier_notes?: string;
  cost?: number;
  pieces_per_bulk?: number;
  created_at: string;
  updated_at: string;
}

interface SupplyHistory {
  id: string;
  supply_id: string;
  action: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  user_id: string;
  created_at: string;
}

interface EnrichedSupplyHistory {
  id: string;
  supply_id: string;
  supply_name: string;
  action: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes?: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

interface CreateUserRequest {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  permissions: string;
}

interface UpdateUserRequest {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  role: string;
  permissions: string;
}

interface CreateSupplyRequest {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  status: string;
  location?: string;
  supplier?: string;
  supplier_name?: string;
  supplier_contact?: string;
  supplier_notes?: string;
  cost?: number;
  pieces_per_bulk?: number;
}

interface UpdateSupplyRequest {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  quantity?: number;
  unit?: string;
  min_quantity?: number;
  status?: string;
  location?: string;
  supplier?: string;
  supplier_name?: string;
  supplier_contact?: string;
  supplier_notes?: string;
  cost?: number;
  pieces_per_bulk?: number;
  stock_in_reason?: string;
  stock_out_reason?: string;
}

class TauriApiService {
  private invoke: ((command: string, args?: any) => Promise<any>) | null = null;
  private invokeLoaded: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    console.log('TauriApiService: Constructor called');
    // Initialize invoke function asynchronously
    this.initializationPromise = this.initializeInvokeAsync();
  }

  // Initialize the invoke function asynchronously
  private async initializeInvokeAsync(): Promise<void> {
    try {
      // Simple wait for Tauri to be loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if we're in a Tauri environment
      if (typeof window === 'undefined') {
        console.log('TauriApiService: Not in browser environment');
        return;
      }

      // Try to get the real invoke function from Tauri
      let realInvoke: any = null;

      // Try multiple ways to access Tauri invoke
      const possibleTauriObjects = [
        (window as any).__TAURI__,
        (window as any).__TAURI_INTERNALS__,
        (window as any).__TAURI_RUNTIME__,
        (window as any).Tauri
      ];

      for (const tauriObj of possibleTauriObjects) {
        if (tauriObj && typeof tauriObj.invoke === 'function') {
          realInvoke = tauriObj.invoke;
          console.log('TauriApiService: Found invoke in Tauri object');
          break;
        }
      }

      // If no real invoke found, try global invoke
      if (!realInvoke && typeof (window as any).invoke === 'function') {
        realInvoke = (window as any).invoke;
        console.log('TauriApiService: Found global invoke function');
      }

      // Use real invoke if available, otherwise use mock
      if (realInvoke) {
        this.invoke = realInvoke;
        this.invokeLoaded = true;
        console.log('TauriApiService: Real invoke function loaded successfully');
      } else {
        // Create a mock invoke function for build time
        this.invoke = async (command: string, args?: any) => {
          console.warn(`TauriApiService: Mock invoke called with command: ${command}`);
          throw new Error('Tauri invoke not available - running in mock mode');
        };
        this.invokeLoaded = false;
        console.warn('TauriApiService: Using mock invoke function (not in Tauri environment)');
      }
    } catch (error) {
      console.error('TauriApiService: Error initializing invoke:', error);
      this.invokeLoaded = false;
    }
  }

  // Wait for initialization to complete
  private async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<LoginResponse> {
    console.log('TauriApiService.login called with:', { username, password });
    
    // Wait for initialization to complete
    await this.waitForInitialization();
    
    if (!this.invoke) {
      console.error('TauriApiService: invoke function not available');
      return {
        success: false,
        error: 'Tauri environment not available'
      };
    }
    
    try {
      console.log('TauriApiService: invoking login command...');
      const response = await this.invoke('login', {
        request: { username, password }
      }) as LoginResponse;
      console.log('TauriApiService: login response received:', response);
      return response;
    } catch (error) {
      console.error('TauriApiService: Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // User management
  async getUsers(): Promise<User[]> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      const response = await this.invoke('get_users') as any;
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response as User[];
      } else if (response && response.users && Array.isArray(response.users)) {
        return response.users as User[];
      } else if (response && Array.isArray(response.data)) {
        return response.data as User[];
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  async createUser(userData: CreateUserRequest): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('create_user', {
        request: userData
      }) as string;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Omit<UpdateUserRequest, 'id'>): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('update_user', {
        request: {
          id: userId,
          ...userData
        }
      }) as string;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('delete_user', {
        request: { id: userId }
      }) as string;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }



  // Supply management
  async getSupplies(): Promise<Supply[]> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('get_supplies') as Supply[];
    } catch (error) {
      console.error('Get supplies error:', error);
      throw error;
    }
  }

  async createSupply(supplyData: CreateSupplyRequest): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      const result = await this.invoke('create_supply', {
        request: supplyData
      }) as string;
      
      // Clear related caches
      // cache.delete('supplies'); // Removed caching
      // cache.delete('supply_histories'); // Removed caching
      
      return result;
    } catch (error) {
      console.error('Create supply error:', error);
      throw error;
    }
  }

  async updateSupply(supplyId: string, supplyData: Partial<UpdateSupplyRequest>): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      const result = await this.invoke('update_supply', {
        request: {
          id: supplyId,
          ...supplyData
        }
      }) as string;
      
      // Clear related caches
      // cache.delete('supplies'); // Removed caching
      // cache.delete('supply_histories'); // Removed caching
      
      return result;
    } catch (error) {
      console.error('Update supply error:', error);
      throw error;
    }
  }

  async deleteSupply(supplyId: string): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('delete_supply', { supply_id: supplyId }) as string;
    } catch (error) {
      console.error('Delete supply error:', error);
      throw error;
    }
  }

  async deleteSupplyHistory(historyId: string): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('delete_supply_history', { history_id: historyId }) as string;
    } catch (error) {
      console.error('Delete supply history error:', error);
      throw error;
    }
  }

  // Supply history
  async getSupplyHistories(): Promise<EnrichedSupplyHistory[]> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('get_supply_histories') as EnrichedSupplyHistory[];
    } catch (error) {
      console.error('Get supply histories error:', error);
      throw error;
    }
  }

  // Authentication methods
  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('forgot_password', {
        request: { email }
      }) as { success: boolean; error?: string };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  }

  async resetPassword(email: string, token: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('reset_password', {
        request: { email, token, password }
      }) as { success: boolean; error?: string };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Failed to reset password' };
    }
  }

  // Reports (placeholder - will be implemented later)
  async getLowStockReport(): Promise<Supply[]> {
    try {
      await this.waitForInitialization();
      const supplies = await this.getSupplies();
      return supplies.filter(supply => supply.quantity <= supply.min_quantity);
    } catch (error) {
      console.error('Get low stock report error:', error);
      throw error;
    }
  }

  async getStockMovementReport(params?: any): Promise<SupplyHistory[]> {
    try {
      await this.waitForInitialization();
      // For now, return all supply histories since we don't have filtering implemented
      return await this.getSupplyHistories();
    } catch (error) {
      console.error('Get stock movement report error:', error);
      throw error;
    }
  }

  // Utility methods
  async isDesktopApp(): Promise<boolean> {
    await this.waitForInitialization();
    return typeof window !== 'undefined' && 'Tauri' in window;
  }

  async getAppVersion(): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('get_version') as string;
    } catch (error) {
      return '1.0.0';
    }
  }

  async getAppName(): Promise<string> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      return await this.invoke('get_name') as string;
    } catch (error) {
      return 'OSSMS Desktop';
    }
  }

  async checkDatabaseStatus(): Promise<{ status: string; message?: string }> {
    try {
      await this.waitForInitialization();
      if (!this.invoke) {
        throw new Error('Tauri invoke function not available');
      }
      // Try to get users as a simple database connectivity test
      await this.invoke('get_users');
      return { status: 'connected' };
    } catch (error) {
      console.error('Database status check failed:', error);
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }


}

export default new TauriApiService(); 