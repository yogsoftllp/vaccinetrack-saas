-- Update existing tables to support multi-tenancy
-- Add tenant_id to all existing tables and update RLS policies

-- Add tenant_id to existing tables that actually exist
ALTER TABLE clinics ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE patients ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE vaccinations ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE inventory ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE medical_history ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Create indexes for tenant_id columns
CREATE INDEX idx_clinics_tenant_id ON clinics(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX idx_vaccinations_tenant_id ON vaccinations(tenant_id);
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX idx_medical_history_tenant_id ON medical_history(tenant_id);

-- Update existing RLS policies to include tenant isolation
-- First, drop existing policies that don't include tenant isolation
DROP POLICY IF EXISTS "clinics_select_policy" ON clinics;
DROP POLICY IF EXISTS "clinics_insert_policy" ON clinics;
DROP POLICY IF EXISTS "clinics_update_policy" ON clinics;
DROP POLICY IF EXISTS "clinics_delete_policy" ON clinics;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

DROP POLICY IF EXISTS "patients_select_policy" ON patients;
DROP POLICY IF EXISTS "patients_insert_policy" ON patients;
DROP POLICY IF EXISTS "patients_update_policy" ON patients;
DROP POLICY IF EXISTS "patients_delete_policy" ON patients;

DROP POLICY IF EXISTS "vaccinations_select_policy" ON vaccinations;
DROP POLICY IF EXISTS "vaccinations_insert_policy" ON vaccinations;
DROP POLICY IF EXISTS "vaccinations_update_policy" ON vaccinations;
DROP POLICY IF EXISTS "vaccinations_delete_policy" ON vaccinations;

DROP POLICY IF EXISTS "appointments_select_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON appointments;

DROP POLICY IF EXISTS "inventory_select_policy" ON inventory;
DROP POLICY IF EXISTS "inventory_insert_policy" ON inventory;
DROP POLICY IF EXISTS "inventory_update_policy" ON inventory;
DROP POLICY IF EXISTS "inventory_delete_policy" ON inventory;

DROP POLICY IF EXISTS "medical_history_select_policy" ON medical_history;
DROP POLICY IF EXISTS "medical_history_insert_policy" ON medical_history;
DROP POLICY IF EXISTS "medical_history_update_policy" ON medical_history;
DROP POLICY IF EXISTS "medical_history_delete_policy" ON medical_history;

-- Create new tenant-aware RLS policies
-- Helper function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_users 
        WHERE tenant_id = tenant_uuid 
        AND user_id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's tenant
CREATE OR REPLACE FUNCTION get_user_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() 
        AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clinics policies
CREATE POLICY "clinics_select_policy" ON clinics
    FOR SELECT USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "clinics_insert_policy" ON clinics
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "clinics_update_policy" ON clinics
    FOR UPDATE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "clinics_delete_policy" ON clinics
    FOR DELETE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Users policies (for tenant users)
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Patients policies
CREATE POLICY "patients_select_policy" ON patients
    FOR SELECT USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "patients_insert_policy" ON patients
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "patients_update_policy" ON patients
    FOR UPDATE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "patients_delete_policy" ON patients
    FOR DELETE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Vaccinations policies
CREATE POLICY "vaccinations_select_policy" ON vaccinations
    FOR SELECT USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "vaccinations_insert_policy" ON vaccinations
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "vaccinations_update_policy" ON vaccinations
    FOR UPDATE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "vaccinations_delete_policy" ON vaccinations
    FOR DELETE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Appointments policies
CREATE POLICY "appointments_select_policy" ON appointments
    FOR SELECT USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "appointments_insert_policy" ON appointments
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "appointments_update_policy" ON appointments
    FOR UPDATE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "appointments_delete_policy" ON appointments
    FOR DELETE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Inventory policies
CREATE POLICY "inventory_select_policy" ON inventory
    FOR SELECT USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "inventory_insert_policy" ON inventory
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "inventory_update_policy" ON inventory
    FOR UPDATE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "inventory_delete_policy" ON inventory
    FOR DELETE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Medical history policies
CREATE POLICY "medical_history_select_policy" ON medical_history
    FOR SELECT USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "medical_history_insert_policy" ON medical_history
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "medical_history_update_policy" ON medical_history
    FOR UPDATE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "medical_history_delete_policy" ON medical_history
    FOR DELETE USING (
        tenant_id = get_user_tenant() OR
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Grant permissions for all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON clinics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vaccinations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON medical_history TO authenticated;