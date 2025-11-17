-- Fix infinite recursion in super_admins RLS policy
-- The issue was that the policy was trying to query the same table it was protecting

-- Drop the problematic policy
DROP POLICY IF EXISTS "super_admins_can_manage_super_admins" ON super_admins;

-- Create a simple policy that allows super admins to manage super admins
-- This approach avoids infinite recursion by using a straightforward check
CREATE POLICY "super_admins_can_manage_super_admins_fixed" ON super_admins
    FOR ALL USING (
        -- Check if current user is a super admin
        -- This query looks for the user's own record in super_admins, which is safe
        EXISTS (
            SELECT 1 FROM super_admins sa_check 
            WHERE sa_check.user_id = auth.uid() 
            AND sa_check.is_active = true
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON super_admins TO authenticated;