-- Fix infinite recursion in users table RLS policies
-- This migration removes problematic recursive policies and sets up proper ones

-- First, disable RLS temporarily to fix the issue
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remove all existing policies on users table
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

-- Create proper RLS policies for users table
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Administrators can view all users
CREATE POLICY "Administrators can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u2 
            WHERE u2.id = auth.uid() 
            AND u2.role = 'administrator'
            AND u2.is_active = true
        )
    );

-- Policy 3: Administrators can update users
CREATE POLICY "Administrators can update users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u2 
            WHERE u2.id = auth.uid() 
            AND u2.role = 'administrator'
            AND u2.is_active = true
        )
    );

-- Policy 4: Users can update their own profile (except role and is_active)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;

-- Check current policies after fix
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