-- Updated script to only update existing users, not insert new ones
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

-- Only update existing user to owner role (user must sign up first)
-- NOTE: The user ankit.koniyal000@gmail.com must sign up through the website first
-- before running this script to grant owner permissions
UPDATE profiles 
SET role = 'owner' 
WHERE email = 'ankit.koniyal000@gmail.com' 
AND id IS NOT NULL;

-- Verify the update worked
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'ankit.koniyal000@gmail.com' AND role = 'owner') THEN
        RAISE NOTICE 'WARNING: User ankit.koniyal000@gmail.com not found or not updated. Please sign up first through the website.';
    ELSE
        RAISE NOTICE 'SUCCESS: User ankit.koniyal000@gmail.com has been granted owner permissions.';
    END IF;
END $$;
