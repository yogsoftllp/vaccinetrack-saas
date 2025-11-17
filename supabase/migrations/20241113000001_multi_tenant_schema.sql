-- Multi-tenant SaaS Schema Migration
-- Creates tables for tenant management, subscriptions, and feature flags

-- Tenants table for multi-tenancy
CREATE TABLE tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    -- Business information
    business_name VARCHAR(255),
    business_address TEXT,
    business_phone VARCHAR(50),
    business_email VARCHAR(255),
    
    -- Configuration
    timezone VARCHAR(100) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Subscription plans table
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB DEFAULT '{}',
    max_users INTEGER DEFAULT 1,
    max_patients INTEGER DEFAULT 100,
    max_appointments_per_month INTEGER DEFAULT 100,
    storage_gb INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tenant subscriptions table
CREATE TABLE tenant_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'expired', 'suspended')),
    
    -- Subscription period
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    
    -- Billing information
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Usage tracking
    users_count INTEGER DEFAULT 0,
    patients_count INTEGER DEFAULT 0,
    appointments_count_this_month INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(tenant_id)
);

-- Feature flags table for tenant-specific features
CREATE TABLE features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_enabled BOOLEAN DEFAULT false,
    requires_plan BOOLEAN DEFAULT false,
    plan_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tenant feature settings
CREATE TABLE tenant_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, feature_id)
);

-- Super admin users (can manage all tenants)
CREATE TABLE super_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Tenant users (link auth.users to tenants)
CREATE TABLE tenant_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, user_id)
);

-- Tenant invitations (for inviting users to tenants)
CREATE TABLE tenant_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist')),
    invited_by UUID REFERENCES auth.users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs for tenant management
CREATE TABLE tenant_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_patients, max_appointments_per_month, storage_gb) VALUES
('Basic', 'Perfect for small clinics just starting out', 29.00, 290.00, '{"basic_features": true, "support": "email"}', 3, 100, 100, 1),
('Professional', 'For growing clinics with advanced needs', 79.00, 790.00, '{"basic_features": true, "advanced_reports": true, "custom_branding": true, "support": "email_chat"}', 10, 1000, 1000, 10),
('Enterprise', 'For large clinics with full customization', 199.00, 1990.00, '{"basic_features": true, "advanced_reports": true, "custom_branding": true, "api_access": true, "white_label": true, "support": "priority"}', 50, 10000, 10000, 100);

-- Insert default features
INSERT INTO features (name, description, category, default_enabled, requires_plan) VALUES
('patient_management', 'Manage patient records and profiles', 'core', true, false),
('appointment_management', 'Schedule and manage appointments', 'core', true, false),
('vaccination_tracking', 'Track vaccination schedules and history', 'core', true, false),
('inventory_management', 'Manage vaccine inventory and stock', 'core', true, false),
('basic_reports', 'Generate basic reports and analytics', 'reporting', true, false),
('advanced_reports', 'Generate advanced analytics and insights', 'reporting', false, true),
('custom_branding', 'Customize clinic branding and logo', 'customization', false, true),
('multi_location', 'Support for multiple clinic locations', 'core', false, true),
('api_access', 'REST API access for integrations', 'integration', false, true),
('white_label', 'Complete white-label solution', 'customization', false, true),
('bulk_sms', 'Send bulk SMS notifications', 'communication', false, true),
('email_notifications', 'Email notifications and reminders', 'communication', true, false),
('patient_portal', 'Patient portal for self-service', 'patient', false, true),
('telemedicine', 'Telemedicine and video consultations', 'communication', false, true),
('custom_forms', 'Create custom forms and questionnaires', 'customization', false, true);

-- Create indexes for performance
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX idx_tenant_features_feature_id ON tenant_features(feature_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_invitations_tenant_id ON tenant_invitations(tenant_id);
CREATE INDEX idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX idx_tenant_activity_logs_tenant_id ON tenant_activity_logs(tenant_id);
CREATE INDEX idx_tenant_activity_logs_created_at ON tenant_activity_logs(created_at);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Tenants: Users can only see their own tenant
CREATE POLICY "tenant_users_can_view_own_tenant" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Super admins can manage all tenants
CREATE POLICY "super_admins_can_manage_all_tenants" ON tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Subscription plans: Everyone can view active plans
CREATE POLICY "everyone_can_view_active_plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Super admins can manage all plans
CREATE POLICY "super_admins_can_manage_plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Tenant subscriptions: Users can only see their own tenant subscription
CREATE POLICY "tenant_users_can_view_own_subscription" ON tenant_subscriptions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Super admins can manage all subscriptions
CREATE POLICY "super_admins_can_manage_subscriptions" ON tenant_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Features: Everyone can view features
CREATE POLICY "everyone_can_view_features" ON features
    FOR SELECT USING (true);

-- Tenant features: Users can only see their own tenant features
CREATE POLICY "tenant_users_can_view_own_features" ON tenant_features
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Tenant admins can manage their tenant features
CREATE POLICY "tenant_admins_can_manage_features" ON tenant_features
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Super admins can manage all features
CREATE POLICY "super_admins_can_manage_features" ON tenant_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Super admins: Only existing super admins can manage super admins
CREATE POLICY "super_admins_can_manage_super_admins" ON super_admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Tenant users: Users can only see users in their tenant
CREATE POLICY "tenant_users_can_view_own_tenant_users" ON tenant_users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Tenant admins can manage users in their tenant
CREATE POLICY "tenant_admins_can_manage_users" ON tenant_users
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Super admins can manage all tenant users
CREATE POLICY "super_admins_can_manage_tenant_users" ON tenant_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Tenant invitations: Users can only see invitations for their tenant
CREATE POLICY "tenant_users_can_view_own_invitations" ON tenant_invitations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Tenant admins can manage invitations in their tenant
CREATE POLICY "tenant_admins_can_manage_invitations" ON tenant_invitations
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Activity logs: Users can only see logs for their tenant
CREATE POLICY "tenant_users_can_view_own_logs" ON tenant_activity_logs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Super admins can manage all logs
CREATE POLICY "super_admins_can_manage_logs" ON tenant_activity_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON tenants TO anon, authenticated;
GRANT SELECT ON subscription_plans TO anon, authenticated;
GRANT SELECT ON tenant_subscriptions TO anon, authenticated;
GRANT SELECT ON features TO anon, authenticated;
GRANT SELECT ON tenant_features TO anon, authenticated;
GRANT SELECT ON tenant_users TO anon, authenticated;
GRANT SELECT ON tenant_invitations TO anon, authenticated;
GRANT SELECT ON tenant_activity_logs TO anon, authenticated;
GRANT SELECT ON super_admins TO anon, authenticated;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_features_updated_at BEFORE UPDATE ON tenant_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON tenant_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();