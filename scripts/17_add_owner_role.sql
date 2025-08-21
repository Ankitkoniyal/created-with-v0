-- Add owner role to profiles table for super admin access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create enum for user roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fix column type conversion by dropping default first
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- Create policy for owner access
CREATE POLICY "Owners can access all profiles" ON profiles
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'owner'
    ));

-- Update to use your actual email address
INSERT INTO profiles (id, email, role) 
VALUES (
    (SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1),
    'your-email@example.com',
    'owner'
) ON CONFLICT (id) DO UPDATE SET role = 'owner';
