import { create } from 'zustand';
import { Tenant } from './superAdminStore';

interface TenantState {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTenantDetails: (tenantId: string) => Promise<void>;
  clearError: () => void;
}

export const useTenantStore = create<TenantState>()((set) => ({
  currentTenant: null,
  isLoading: false,
  error: null,

  fetchTenantDetails: async (tenantId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/tenant/details/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
      }

      const data = await response.json();
      if (data.success) {
        set({ 
          currentTenant: data.tenant, 
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        error: 'Failed to fetch tenant details', 
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null })
}));