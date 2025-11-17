-- Seed demo data for testing

-- Insert demo tenant
INSERT INTO public.tenants (
    name, 
    subdomain, 
    business_name, 
    business_address, 
    business_phone, 
    business_email, 
    timezone, 
    locale,
    status
) VALUES (
    'Demo Clinic',
    'demo',
    'Demo Pediatric Clinic',
    '123 Demo Street, Demo City, 12345',
    '+1-555-123-4567',
    'demo@clinic.com',
    'America/New_York',
    'en',
    'active'
);

-- Get the demo tenant ID
WITH demo_tenant AS (
    SELECT id FROM public.tenants WHERE subdomain = 'demo'
)
-- Insert demo clinic
INSERT INTO public.clinics (
    name, 
    address, 
    phone, 
    email, 
    license_number,
    tenant_id
)
SELECT 
    'Demo Pediatric Clinic',
    '123 Demo Street, Demo City, 12345',
    '+1-555-123-4567',
    'demo@clinic.com',
    'DEMO123456',
    id
FROM demo_tenant;

-- Insert demo users (auth.users will be created via API, but we need the mapping)
-- First, let's create a super admin user in auth.users
-- This will be done via the API after we have the tenant set up

-- Insert subscription plans if not exists
INSERT INTO public.subscription_plans (
    name,
    description,
    price_monthly,
    price_yearly,
    max_users,
    max_patients,
    max_appointments_per_month,
    storage_gb,
    features,
    is_active
) VALUES 
('Basic', 'Basic plan for small clinics', 29.00, 290.00, 5, 100, 100, 1, '{"patient_management": true, "appointment_management": true, "basic_reports": true}', true),
('Professional', 'Professional plan for growing clinics', 79.00, 790.00, 15, 500, 500, 5, '{"patient_management": true, "appointment_management": true, "advanced_scheduling": true, "inventory_management": true, "basic_reports": true, "advanced_reports": true}', true),
('Enterprise', 'Enterprise plan for large clinics', 199.00, 1990.00, 50, 2000, 2000, 20, '{"patient_management": true, "appointment_management": true, "advanced_scheduling": true, "inventory_management": true, "basic_reports": true, "advanced_reports": true, "custom_branding": true, "api_access": true}', true)
ON CONFLICT (name) DO NOTHING;

-- Insert features if not exists
INSERT INTO public.features (
    name,
    description,
    category,
    default_enabled,
    requires_plan
) VALUES 
('patient_management', 'Manage patient records and profiles', 'core', true, false),
('appointment_management', 'Schedule and manage appointments', 'core', true, false),
('vaccination_management', 'Manage vaccination records and schedules', 'core', true, false),
('inventory_management', 'Track vaccine inventory and stock levels', 'advanced', false, true),
('advanced_scheduling', 'Advanced appointment scheduling features', 'advanced', false, true),
('appointment_reminders', 'Send appointment reminders to patients', 'communication', false, true),
('patient_analytics', 'Advanced patient analytics and reporting', 'analytics', false, true),
('basic_reports', 'Basic reporting and analytics', 'analytics', true, false),
('advanced_reports', 'Advanced reporting and dashboards', 'analytics', false, true),
('custom_branding', 'Custom branding and white-labeling', 'customization', false, true),
('api_access', 'API access for integrations', 'integration', false, true),
('multi_location', 'Support for multiple clinic locations', 'advanced', false, true)
ON CONFLICT (name) DO NOTHING;

-- Link demo tenant to basic plan
WITH demo_tenant AS (
    SELECT id FROM public.tenants WHERE subdomain = 'demo'
),
basic_plan AS (
    SELECT id FROM public.subscription_plans WHERE name = 'Basic'
)
INSERT INTO public.tenant_subscriptions (
    tenant_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    trial_start,
    trial_end
)
SELECT 
    dt.id,
    bp.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW() + INTERVAL '30 days'
FROM demo_tenant dt, basic_plan bp;

-- Enable basic features for demo tenant
WITH demo_tenant AS (
    SELECT id FROM public.tenants WHERE subdomain = 'demo'
)
INSERT INTO public.tenant_features (tenant_id, feature_id, enabled)
SELECT 
    dt.id,
    f.id,
    f.default_enabled
FROM demo_tenant dt
CROSS JOIN public.features f;