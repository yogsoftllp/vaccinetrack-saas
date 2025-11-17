import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'suspended' | 'cancelled';
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  timezone: string;
  locale: string;
  is_active?: boolean;
  user_count?: number;
  subscription?: TenantSubscription;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  price?: number; // Add price property for compatibility
  features: Record<string, any>;
  max_users: number;
  max_patients: number;
  max_appointments_per_month: number;
  storage_gb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  plan_name?: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired' | 'suspended';
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  users_count: number;
  patients_count: number;
  appointments_count_this_month: number;
  storage_used_mb: number;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  category: string;
  default_enabled: boolean;
  requires_plan: boolean;
  plan_ids: string[];
  is_premium?: boolean;
  created_at: string;
}

export interface TenantFeature {
  id: string;
  tenant_id: string;
  feature_id: string;
  enabled: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  feature?: Feature;
}

export interface CreateTenantData {
  name: string;
  subdomain: string;
  business_name?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  timezone?: string;
  locale?: string;
  plan_id: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
}

interface SuperAdminState {
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  tenants: Tenant[];
  subscriptionPlans: SubscriptionPlan[];
  tenantSubscriptions: Record<string, TenantSubscription>;
  tenantFeatures: Record<string, TenantFeature[]>;
  features: Feature[];
  
  checkSuperAdminStatus: () => Promise<void>;
  fetchTenants: () => Promise<void>;
  fetchSubscriptionPlans: () => Promise<void>;
  fetchFeatures: () => Promise<void>;
  fetchTenantSubscription: (tenantId: string) => Promise<void>;
  fetchTenantFeatures: (tenantId: string) => Promise<void>;
  fetchTenantDetails: (tenantId: string) => Promise<void>;
  createTenant: (data: CreateTenantData) => Promise<void>;
  updateTenant: (tenantId: string, data: Partial<Tenant>) => Promise<void>;
  updateTenantSubscription: (tenantId: string, planId: string) => Promise<void>;
  updateTenantFeature: (tenantId: string, featureId: string, enabled: boolean, settings?: Record<string, any>) => Promise<void>;
  suspendTenant: (tenantId: string) => Promise<void>;
  reactivateTenant: (tenantId: string) => Promise<void>;
  clearError: () => void;
}

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
  isSuperAdmin: false,
  isLoading: false,
  error: null,
  tenants: [],
  subscriptionPlans: [],
  tenantSubscriptions: {},
  tenantFeatures: {},
  features: [],

  checkSuperAdminStatus: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isSuperAdmin: false });
        return;
      }

      const { data, error } = await supabase
        .from('super_admins')
        .select('is_active')
        .eq('user_id', user.id)
        .single();

      if (error) {
        set({ isSuperAdmin: false });
        return;
      }

      set({ isSuperAdmin: data?.is_active || false });
    } catch (error) {
      console.error('Error checking super admin status:', error);
      set({ isSuperAdmin: false });
    }
  },

  fetchTenants: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tenants: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      set({ error: 'Failed to fetch tenants', isLoading: false });
    }
  },

  fetchSubscriptionPlans: async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      set({ subscriptionPlans: data || [] });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  },

  fetchFeatures: async () => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      set({ features: data || [] });
    } catch (error) {
      console.error('Error fetching features:', error);
    }
  },

  fetchTenantSubscription: async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        set(state => ({
          tenantSubscriptions: {
            ...state.tenantSubscriptions,
            [tenantId]: data
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching tenant subscription:', error);
    }
  },

  fetchTenantFeatures: async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenant_features')
        .select(`
          *,
          feature:features(*)
        `)
        .eq('tenant_id', tenantId);

      if (error) throw error;
      set(state => ({
        tenantFeatures: {
          ...state.tenantFeatures,
          [tenantId]: data || []
        }
      }));
    } catch (error) {
      console.error('Error fetching tenant features:', error);
    }
  },

  fetchTenantDetails: async (tenantId: string) => {
    try {
      // Fetch tenant subscription
      await get().fetchTenantSubscription(tenantId);
      // Fetch tenant features
      await get().fetchTenantFeatures(tenantId);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
    }
  },

  createTenant: async (data: CreateTenantData) => {
    set({ isLoading: true, error: null });
    try {
      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.name,
          subdomain: data.subdomain,
          business_name: data.business_name,
          business_address: data.business_address,
          business_phone: data.business_phone,
          business_email: data.business_email,
          timezone: data.timezone || 'UTC',
          locale: data.locale || 'en'
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create subscription
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

      const { error: subscriptionError } = await supabase
        .from('tenant_subscriptions')
        .insert({
          tenant_id: tenant.id,
          plan_id: data.plan_id,
          status: 'trial',
          current_period_start: now.toISOString(),
          current_period_end: trialEnd.toISOString(),
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString()
        });

      if (subscriptionError) throw subscriptionError;

      // Create admin user
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: data.admin_email,
        password: Math.random().toString(36).slice(-8) // Temporary password
      });

      if (authError) throw authError;
      if (!user) throw new Error('Failed to create admin user');

      // Create tenant user record
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: 'admin'
        });

      if (tenantUserError) throw tenantUserError;

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: data.admin_email,
          role: 'administrator',
          first_name: data.admin_first_name,
          last_name: data.admin_last_name,
          clinic_id: tenant.id, // Use tenant as clinic for now
          tenant_id: tenant.id
        });

      if (userError) throw userError;

      // Enable default features
      const { data: features } = await supabase
        .from('features')
        .select('id')
        .eq('default_enabled', true);

      if (features && features.length > 0) {
        const tenantFeatures = features.map(feature => ({
          tenant_id: tenant.id,
          feature_id: feature.id,
          enabled: true
        }));

        const { error: featuresError } = await supabase
          .from('tenant_features')
          .insert(tenantFeatures);

        if (featuresError) throw featuresError;
      }

      // Refresh tenants list
      await get().fetchTenants();
      set({ isLoading: false });
    } catch (error) {
      console.error('Error creating tenant:', error);
      set({ error: 'Failed to create tenant', isLoading: false });
      throw error;
    }
  },

  updateTenant: async (tenantId: string, data: Partial<Tenant>) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update(data)
        .eq('id', tenantId);

      if (error) throw error;

      // Refresh tenants list
      await get().fetchTenants();
    } catch (error) {
      console.error('Error updating tenant:', error);
      set({ error: 'Failed to update tenant' });
      throw error;
    }
  },

  updateTenantSubscription: async (tenantId: string, planId: string) => {
    try {
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({ plan_id: planId })
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Refresh subscription data
      await get().fetchTenantSubscription(tenantId);
    } catch (error) {
      console.error('Error updating tenant subscription:', error);
      set({ error: 'Failed to update subscription' });
      throw error;
    }
  },

  updateTenantFeature: async (tenantId: string, featureId: string, enabled: boolean, settings?: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('tenant_features')
        .upsert({
          tenant_id: tenantId,
          feature_id: featureId,
          enabled,
          settings: settings || {}
        }, {
          onConflict: 'tenant_id,feature_id'
        });

      if (error) throw error;

      // Refresh features data
      await get().fetchTenantFeatures(tenantId);
    } catch (error) {
      console.error('Error updating tenant feature:', error);
      set({ error: 'Failed to update feature' });
      throw error;
    }
  },

  suspendTenant: async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'suspended' })
        .eq('id', tenantId);

      if (error) throw error;

      // Refresh tenants list
      await get().fetchTenants();
    } catch (error) {
      console.error('Error suspending tenant:', error);
      set({ error: 'Failed to suspend tenant' });
      throw error;
    }
  },

  reactivateTenant: async (tenantId: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'active' })
        .eq('id', tenantId);

      if (error) throw error;

      // Refresh tenants list
      await get().fetchTenants();
    } catch (error) {
      console.error('Error reactivating tenant:', error);
      set({ error: 'Failed to reactivate tenant' });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));