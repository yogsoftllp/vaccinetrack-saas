-- Grant proper permissions for users table after RLS fix
-- This ensures that both anon and authenticated roles can access the users table properly

-- Grant basic read access to anon role (for public registration/checks)
GRANT SELECT ON users TO anon;

-- Grant full access to authenticated role (for logged-in users)
GRANT SELECT, UPDATE ON users TO authenticated;

-- Check current permissions
SELECT 
    grantee,
    table_name,
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;