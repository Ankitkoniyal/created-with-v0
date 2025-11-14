-- Create tables for tracking deactivated ads and banned users
-- This provides a dedicated audit trail for moderation actions

-- Create deactivated_ads table to track ads that have been deactivated
CREATE TABLE IF NOT EXISTS deactivated_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  deactivated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  status_before TEXT, -- Store the status before deactivation
  status_after TEXT NOT NULL DEFAULT 'inactive', -- Status after deactivation
  moderation_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id) -- One record per product (most recent deactivation)
);

-- Create banned_users table to track users that have been banned
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status_before TEXT, -- Store the status before ban
  status_after TEXT NOT NULL DEFAULT 'banned', -- Status after ban
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional: for temporary bans
  is_active BOOLEAN DEFAULT TRUE, -- Track if ban is still active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial unique index to ensure only one active ban per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_banned_users_one_active_ban 
ON banned_users(user_id) 
WHERE is_active = TRUE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deactivated_ads_product_id ON deactivated_ads(product_id);
CREATE INDEX IF NOT EXISTS idx_deactivated_ads_deactivated_by ON deactivated_ads(deactivated_by);
CREATE INDEX IF NOT EXISTS idx_deactivated_ads_created_at ON deactivated_ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deactivated_ads_status_after ON deactivated_ads(status_after);

CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by ON banned_users(banned_by);
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_at ON banned_users(banned_at DESC);
CREATE INDEX IF NOT EXISTS idx_banned_users_is_active ON banned_users(is_active);
CREATE INDEX IF NOT EXISTS idx_banned_users_status_after ON banned_users(status_after);

-- Enable Row Level Security
ALTER TABLE deactivated_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deactivated_ads
-- Only admins can view all deactivated ads
CREATE POLICY "Admins can view all deactivated ads" ON deactivated_ads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins can insert deactivated ads records
CREATE POLICY "Admins can create deactivated ads records" ON deactivated_ads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins can update deactivated ads records
CREATE POLICY "Admins can update deactivated ads records" ON deactivated_ads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for banned_users
-- Only admins can view all banned users
CREATE POLICY "Admins can view all banned users" ON banned_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins can insert banned users records
CREATE POLICY "Admins can create banned users records" ON banned_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins can update banned users records
CREATE POLICY "Admins can update banned users records" ON banned_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create a function to automatically create deactivated_ads record when product status changes to inactive/deleted/rejected/deactivated
CREATE OR REPLACE FUNCTION track_deactivated_ad()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if status changed to a deactivated state
  IF NEW.status IN ('inactive', 'deleted', 'rejected', 'deactivated') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('inactive', 'deleted', 'rejected', 'deactivated')) THEN
    
    -- Insert or update the deactivated_ads record
    INSERT INTO deactivated_ads (
      product_id,
      deactivated_by,
      reason,
      status_before,
      status_after,
      moderation_note
    ) VALUES (
      NEW.id,
      COALESCE(NEW.moderated_by, auth.uid()), -- Use moderated_by if available, else current user
      NULL, -- Reason can be added separately
      OLD.status,
      NEW.status,
      NEW.moderation_note
    )
    ON CONFLICT (product_id) 
    DO UPDATE SET
      deactivated_by = EXCLUDED.deactivated_by,
      reason = COALESCE(EXCLUDED.reason, deactivated_ads.reason),
      status_before = EXCLUDED.status_before,
      status_after = EXCLUDED.status_after,
      moderation_note = EXCLUDED.moderation_note,
      created_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to track deactivated ads
DROP TRIGGER IF EXISTS track_deactivated_ad_trigger ON products;
CREATE TRIGGER track_deactivated_ad_trigger
  AFTER UPDATE OF status ON products
  FOR EACH ROW
  WHEN (NEW.status IN ('inactive', 'deleted', 'rejected', 'deactivated'))
  EXECUTE FUNCTION track_deactivated_ad();

-- Note: For banned users, we'll handle it manually in the application code
-- since user status is stored in user_metadata (account_status) rather than profiles table

