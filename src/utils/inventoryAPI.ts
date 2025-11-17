import { supabase } from './supabase';

// Helper function to get current tenant ID
export const getCurrentTenantId = (): string => {
  // Try to get tenant ID from localStorage first (for subdomain-based tenants)
  const storedTenant = localStorage.getItem('currentTenant');
  if (storedTenant) {
    try {
      const tenantData = JSON.parse(storedTenant);
      return tenantData.id;
    } catch (e) {
      console.error('Error parsing stored tenant data:', e);
    }
  }
  
  // Fallback to subdomain extraction
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  // If we're on a subdomain (not localhost or main domain), use it as tenant identifier
  if (subdomain && subdomain !== 'localhost' && subdomain !== 'clinic') {
    return subdomain;
  }
  
  // Default tenant ID for main domain
  return 'default';
};

export interface Vaccine {
  id: string;
  tenant_id: string;
  name: string;
  abbreviation: string;
  manufacturer: string;
  lot_number: string;
  expiration_date: string;
  storage_temp_min: number;
  storage_temp_max: number;
  unit_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  vaccine_id: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  location: string;
  notes: string | null;
  last_updated: string;
  vaccines?: Vaccine;
}

export interface InventoryTransaction {
  id: string;
  tenant_id: string;
  vaccine_id: string;
  transaction_type: 'stock_in' | 'stock_out' | 'adjustment' | 'expired' | 'damaged';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  vaccines?: Vaccine;
}

export interface InventoryFilters {
  search?: string;
  low_stock?: boolean;
  expired?: boolean;
  location?: string;
  sort_by?: 'name' | 'stock' | 'expiration' | 'cost';
  sort_order?: 'asc' | 'desc';
}

export interface CreateVaccineData {
  name: string;
  abbreviation: string;
  manufacturer: string;
  lot_number: string;
  expiration_date: string;
  storage_temp_min: number;
  storage_temp_max: number;
  unit_cost: number;
}

export interface CreateInventoryItemData {
  vaccine_id: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  location: string;
  notes?: string;
}

export interface UpdateStockData {
  vaccine_id: string;
  quantity_change: number;
  transaction_type: InventoryTransaction['transaction_type'];
  notes?: string;
  reference_id?: string;
}

export const inventoryAPI = {
  // Get all vaccines for current tenant
  async getVaccines(filters: { search?: string; is_active?: boolean } = {}): Promise<Vaccine[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      let query = supabase
        .from('vaccines')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', filters.is_active !== false);

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,abbreviation.ilike.%${filters.search}%,manufacturer.ilike.%${filters.search}%`);
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }
      
      return data as Vaccine[];
    } catch (error) {
      console.error('Error fetching vaccines:', error);
      throw error;
    }
  },

  // Get single vaccine by ID with tenant verification
  async getVaccineById(id: string): Promise<Vaccine | null> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('vaccines')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data as Vaccine;
    } catch (error) {
      console.error('Error fetching vaccine:', error);
      throw error;
    }
  },

  // Get inventory items for current tenant
  async getInventoryItems(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      let query = supabase
        .from('inventory')
        .select(`
          *,
          vaccines (*)
        `)
        .eq('tenant_id', tenantId);

      // Apply search filter
      if (filters.search) {
        query = query.or(`vaccines.name.ilike.%${filters.search}%,vaccines.abbreviation.ilike.%${filters.search}%`);
      }

      // Apply low stock filter
      if (filters.low_stock) {
        query = query.lte('current_stock', 'reorder_point');
      }

      // Apply location filter
      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'vaccines.name';
      const sortOrder = filters.sort_order || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }
      
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  },

  // Get inventory item by ID with tenant verification
  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          vaccines (*)
        `)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      
      return data as InventoryItem;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  },

  // Create new vaccine with tenant isolation
  async createVaccine(vaccineData: CreateVaccineData): Promise<Vaccine> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('vaccines')
        .insert([{
          ...vaccineData,
          tenant_id: tenantId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Vaccine;
    } catch (error) {
      console.error('Error creating vaccine:', error);
      throw error;
    }
  },

  // Create inventory item with tenant isolation
  async createInventoryItem(itemData: CreateInventoryItemData): Promise<InventoryItem> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Verify the vaccine belongs to the current tenant
      const vaccine = await this.getVaccineById(itemData.vaccine_id);
      if (!vaccine) {
        throw new Error('Vaccine not found or access denied');
      }
      
      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          ...itemData,
          tenant_id: tenantId,
          last_updated: new Date().toISOString()
        }])
        .select(`
          *,
          vaccines (*)
        `)
        .single();

      if (error) throw error;
      return data as InventoryItem;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  // Update vaccine with tenant verification
  async updateVaccine(id: string, updates: Partial<CreateVaccineData>): Promise<Vaccine> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('vaccines')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Vaccine not found or access denied');
        }
        throw error;
      }
      
      return data as Vaccine;
    } catch (error) {
      console.error('Error updating vaccine:', error);
      throw error;
    }
  },

  // Update inventory item with tenant verification
  async updateInventoryItem(id: string, updates: Partial<CreateInventoryItemData>): Promise<InventoryItem> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('inventory')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select(`
          *,
          vaccines (*)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Inventory item not found or access denied');
        }
        throw error;
      }
      
      return data as InventoryItem;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Update stock with transaction logging
  async updateStock(stockData: UpdateStockData): Promise<{ inventory: InventoryItem; transaction: InventoryTransaction }> {
    try {
      const tenantId = getCurrentTenantId();
      
      // Get current inventory item
      const { data: currentItem, error: itemError } = await supabase
        .from('inventory')
        .select('*')
        .eq('vaccine_id', stockData.vaccine_id)
        .eq('tenant_id', tenantId)
        .single();

      if (itemError || !currentItem) {
        throw new Error('Inventory item not found or access denied');
      }

      const newStock = currentItem.current_stock + stockData.quantity_change;
      
      // Update inventory stock
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory')
        .update({ 
          current_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', currentItem.id)
        .eq('tenant_id', tenantId)
        .select(`
          *,
          vaccines (*)
        `)
        .single();

      if (updateError) throw updateError;

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert([{
          tenant_id: tenantId,
          vaccine_id: stockData.vaccine_id,
          transaction_type: stockData.transaction_type,
          quantity: stockData.quantity_change,
          previous_stock: currentItem.current_stock,
          new_stock: newStock,
          reference_id: stockData.reference_id,
          notes: stockData.notes,
          created_by: 'current_user', // This should be replaced with actual user ID
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      return {
        inventory: updatedItem as InventoryItem,
        transaction: transaction as InventoryTransaction
      };
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Get inventory transactions for current tenant
  async getInventoryTransactions(filters: { 
    vaccine_id?: string; 
    transaction_type?: string; 
    date_from?: string; 
    date_to?: string;
    limit?: number;
  } = {}): Promise<InventoryTransaction[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          vaccines (*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.vaccine_id) {
        query = query.eq('vaccine_id', filters.vaccine_id);
      }
      
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }
      
      return data as InventoryTransaction[];
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      throw error;
    }
  },

  // Get low stock alerts for current tenant
  async getLowStockAlerts(): Promise<InventoryItem[]> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          vaccines (*)
        `)
        .eq('tenant_id', tenantId)
        .lte('current_stock', 'reorder_point')
        .gt('current_stock', 0)
        .order('current_stock', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }
      
      return data as InventoryItem[];
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      throw error;
    }
  },

  // Get expired vaccines for current tenant
  async getExpiredVaccines(): Promise<Vaccine[]> {
    try {
      const tenantId = getCurrentTenantId();
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('vaccines')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .lt('expiration_date', today)
        .order('expiration_date', { ascending: true });

      if (error) {
        if (error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }
      
      return data as Vaccine[];
    } catch (error) {
      console.error('Error fetching expired vaccines:', error);
      throw error;
    }
  },

  // Delete vaccine (soft delete) with tenant verification
  async deleteVaccine(id: string): Promise<void> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { error } = await supabase
        .from('vaccines')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting vaccine:', error);
      throw error;
    }
  },

  // Delete inventory item with tenant verification
  async deleteInventoryItem(id: string): Promise<void> {
    try {
      const tenantId = getCurrentTenantId();
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }
};