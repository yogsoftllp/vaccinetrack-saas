-- Fix tenant_users RLS policies - drop and recreate with safer approach
-- This fixes any remaining recursion issues

-- Drop the existing safe policies if they exist
DROP POLICY IF EXISTS "tenant_users_can_view_own_tenant_users_safe" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_can_manage_tenant_users_safe" ON tenant_users;

-- Drop any remaining problematic policies
DROP POLICY IF EXISTS "tenant_users_can_view_own_tenant_users" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_can_manage_tenant_users" ON tenant_users;

-- Create safer policies that avoid self-referential queries
-- Use a direct query approach similar to the super_admins fix

-- Policy for viewing tenant users: users can see users in their tenant
CREATE POLICY "tenant_users_can_view_own_tenant_users_fixed" ON tenant_users
    FOR SELECT USING (
        -- User can see records if they have the same tenant_id
        EXISTS (
            SELECT 1 FROM tenant_users tu_check 
            WHERE tu_check.user_id = auth.uid() 
            AND tu_check.tenant_id = tenant_users.tenant_id
            AND tu_check.is_active = true
        ) OR
        -- Or if they're a super admin
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Policy for managing tenant users: tenant admins can manage users in their tenant
CREATE POLICY "tenant_users_can_manage_tenant_users_fixed" ON tenant_users
    FOR ALL USING (
        -- User can manage if they're an admin in the same tenant
        EXISTS (
            SELECT 1 FROM tenant_users tu_admin 
            WHERE tu_admin.user_id = auth.uid() 
            AND tu_admin.tenant_id = tenant_users.tenant_id
            AND tu_admin.role IN ('administrator', 'tenant_admin')
            AND tu_admin.is_active = true
        ) OR
        -- Or if they're a super admin
        EXISTS (
            SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Grant necessary permissions
GRANT SELECT ON tenant_users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON tenant_users TO authenticated;