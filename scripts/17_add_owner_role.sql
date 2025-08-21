-- Add owner role to profiles table for super admin access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create enum for user roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update role column to use enum
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Set default role
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Create policy for owner access
CREATE POLICY "Owners can access all profiles" ON profiles
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'owner'
    ));

-- Insert owner role for the website owner (replace email with actual owner email)
INSERT INTO profiles (id, email, role) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'owner@example.com' LIMIT 1),
    'owner@example.com',
    'owner'
) ON CONFLICT (id) DO UPDATE SET role = 'owner';
