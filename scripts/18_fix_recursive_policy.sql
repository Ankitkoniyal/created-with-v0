-- Fix infinite recursion in profiles RLS policy
-- The issue: "Owners can access all profiles" policy queries profiles table to check owner role
-- This creates infinite recursion: profiles -> check owner -> profiles -> check owner...

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Owners can access all profiles" ON profiles;

-- Create a simpler, non-recursive policy that checks auth metadata or uses a function
-- Option 1: Use a stored function to avoid recursion
CREATE OR REPLACE FUNCTION is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has owner role without causing recursion
  -- We'll use a direct query with explicit user context
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'owner'
    AND id = auth.uid() -- Ensure we're only checking the current user
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new non-recursive owner policy
CREATE POLICY "Owners can access all profiles v2" ON profiles
    FOR ALL USING (
      -- Allow users to access their own profile OR if they are owner
      auth.uid() = id OR 
      (auth.uid() IS NOT NULL AND is_owner(auth.uid()))
    );

-- Ensure all existing policies work correctly
-- Update the basic profile policies to be more explicit
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate basic policies with better logic
CREATE POLICY "Users can view profiles" ON profiles 
    FOR SELECT USING (
      true -- Anyone can view profiles (public info)
    );

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (
      auth.uid() = id OR is_owner(auth.uid())
    );

CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT WITH CHECK (
      auth.uid() = id
    );

CREATE POLICY "Users can delete own profile" ON profiles 
    FOR DELETE USING (
      auth.uid() = id OR is_owner(auth.uid())
    );
