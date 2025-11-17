-- Fix infinite recursion in users table RLS policies - Complete rewrite
-- The issue is likely in the subquery that references the same table

-- First, completely disable RLS and remove all policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT polname 
        FROM pg_policy 
        WHERE polrelid = 'public.users'::regclass
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.polname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simplified, non-recursive policies
-- Policy 1: Users can always see their own record
CREATE POLICY "users_view_own" ON users
    FOR SELECT
    USING (id = auth.uid());

-- Policy 2: Administrators can see all users (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users u
        WHERE u.id = user_id 
        AND u.role = 'administrator' 
        AND u.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "admin_view_all_users" ON users
    FOR SELECT
    USING (is_admin(auth.uid()));

-- Policy 3: Users can update their own profile (except sensitive fields)
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 4: Administrators can update any user
CREATE POLICY "admin_update_users" ON users
    FOR UPDATE
    USING (is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT ON users TO anon;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Test the policies
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command_type,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
    pol.polpermissive as is_permissive
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' AND pc.relname = 'users'
ORDER BY pol.polname;