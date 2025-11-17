import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  configurable: boolean;
  enabled?: boolean;
}

export interface TenantFeature extends Feature {
  tenant_feature_id: string;
  enabled: boolean;
}

interface FeatureStore {
  features: Feature[];
  tenantFeatures: TenantFeature[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchFeatures: () => Promise<void>;
  fetchTenantFeatures: (tenantId: string) => Promise<void>;
  updateTenantFeature: (tenantId: string, featureId: string, enabled: boolean) => Promise<void>;
  bulkUpdateTenantFeatures: (tenantId: string, features: { feature_id: string; enabled: boolean }[]) => Promise<void>;
  isFeatureEnabled: (featureName: string) => boolean;
  checkFeature: (featureName: string) => Promise<boolean>;
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  features: [],
  tenantFeatures: [],
  loading: false,
  error: null,

  fetchFeatures: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/features', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch features');
      }

      const data = await response.json();
      set({ features: data.features, loading: false });
    } catch (error) {
      console.error('Error fetching features:', error);
      set({ error: 'Failed to fetch features', loading: false });
    }
  },

  fetchTenantFeatures: async (tenantId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/tenants/${tenantId}/features`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tenant features');
      }

      const data = await response.json();
      set({ tenantFeatures: data.features, loading: false });
    } catch (error) {
      console.error('Error fetching tenant features:', error);
      set({ error: 'Failed to fetch tenant features', loading: false });
    }
  },

  updateTenantFeature: async (tenantId: string, featureId: string, enabled: boolean) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/tenants/${tenantId}/features/${featureId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feature');
      }

      // Refresh tenant features
      await get().fetchTenantFeatures(tenantId);
      set({ loading: false });
    } catch (error) {
      console.error('Error updating feature:', error);
      set({ error: 'Failed to update feature', loading: false });
    }
  },

  bulkUpdateTenantFeatures: async (tenantId: string, features: { feature_id: string; enabled: boolean }[]) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/tenants/${tenantId}/features/bulk`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update features');
      }

      // Refresh tenant features
      await get().fetchTenantFeatures(tenantId);
      set({ loading: false });
    } catch (error) {
      console.error('Error bulk updating features:', error);
      set({ error: 'Failed to bulk update features', loading: false });
    }
  },

  isFeatureEnabled: (featureName: string) => {
    const { tenantFeatures } = get();
    const feature = tenantFeatures.find(f => f.name === featureName);
    return feature?.enabled || false;
  },

  checkFeature: async (featureName: string) => {
    try {
      const response = await fetch(`/api/tenant/features/${featureName}/check`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.enabled;
    } catch (error) {
      console.error('Error checking feature:', error);
      return false;
    }
  },
}));