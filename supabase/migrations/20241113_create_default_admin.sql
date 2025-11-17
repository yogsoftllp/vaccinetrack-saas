-- Create default admin user for testing
-- This creates a user in both Supabase Auth and the users table

-- First, let's create a clinic if none exists
INSERT INTO clinics (name, address, phone, email, license_number) 
VALUES ('Demo Pediatric Clinic', '123 Main Street, City, State 12345', '(555) 123-4567', 'admin@democlinic.com', 'CLINIC-2024-001')
ON CONFLICT DO NOTHING;

-- Create default admin user
-- Note: The password will be set through Supabase Auth, then we'll link the user
-- Default credentials: admin@democlinic.com / Admin123!