-- Add registration_method column to profiles table
-- This tracks how users registered: 'email' (direct signup), 'google' (Google OAuth), 'facebook' (Facebook OAuth), etc.

-- Add registration_method column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS registration_method TEXT DEFAULT 'email' CHECK (registration_method IN ('email', 'google', 'facebook', 'apple', 'github', 'unknown'));

-- Add comment
COMMENT ON COLUMN profiles.registration_method IS 'How the user registered: email (direct signup), google (Google OAuth), facebook, apple, github, or unknown';

-- Update existing records based on auth provider
-- Check if user has OAuth providers linked via auth.identities table
UPDATE profiles p
SET registration_method = CASE
  WHEN EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = p.id
    AND i.provider = 'google'
  ) THEN 'google'
  WHEN EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = p.id
    AND i.provider = 'facebook'
  ) THEN 'facebook'
  WHEN EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = p.id
    AND i.provider = 'apple'
  ) THEN 'apple'
  WHEN EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = p.id
    AND i.provider = 'github'
  ) THEN 'github'
  ELSE 'email'
END
WHERE registration_method IS NULL OR registration_method = 'email';

-- Update trigger function to detect registration method
-- Note: At trigger time, identities might not be created yet, so we default to 'email'
-- The callback route will update this to the correct value for OAuth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  registration_method_value TEXT;
BEGIN
  -- Default to 'email' - the callback route will update this for OAuth signups
  -- This is safer because identities might not exist at trigger time
  registration_method_value := 'email';

  INSERT INTO public.profiles (id, email, full_name, phone, avatar_url, registration_method)
  VALUES (
    NEW.id, 
    NEW.email, 
    -- Try multiple sources for full_name (Google uses 'name', others use 'full_name')
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NULL
    ),
    -- Phone number - only set if provided, otherwise NULL
    -- For OAuth providers, this will be NULL unless explicitly provided
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    -- Avatar URL (Google OAuth provides this as 'picture' or 'avatar_url')
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    registration_method_value
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_registration_method ON profiles(registration_method);

-- Clean up any test/dummy phone numbers (like 1234567890)
-- This updates phone to NULL if it matches common test patterns
UPDATE profiles
SET phone = NULL
WHERE phone IN ('1234567890', '123456789', '12345678', '0000000000', '1111111111', '9999999999')
  OR phone ~ '^12345+$'  -- Matches 12345, 123456, 1234567, etc.
  OR phone ~ '^000+$'    -- Matches 000, 0000, 00000, etc.
  OR phone ~ '^111+$'    -- Matches 111, 1111, 11111, etc.
  OR phone ~ '^999+$';   -- Matches 999, 9999, 99999, etc.

-- Add comment explaining the cleanup
COMMENT ON COLUMN profiles.phone IS 'User phone number. NULL for OAuth signups unless explicitly provided. Test/dummy numbers are automatically cleaned.';

