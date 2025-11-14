-- Add missing moderation and tracking columns to products and profiles tables
-- This ensures all admin actions are properly tracked

-- ============================================
-- PRODUCTS TABLE - Add moderation tracking columns
-- ============================================

-- Add moderated_by column (who performed the moderation)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add moderated_at column (when moderation happened)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- Add moderation_note column (reason/notes for moderation)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS moderation_note TEXT;

-- Ensure status column exists and has correct values
-- Update status constraint to include all possible values
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
    
    -- Add new constraint with all status values
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('active', 'sold', 'inactive', 'pending', 'rejected', 'deleted', 'deactivated', 'expired'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PROFILES TABLE - Add user status tracking columns
-- ============================================

-- Add status column for user account status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add role column if it doesn't exist (for admin/super_admin)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add deleted_at column (soft delete timestamp)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deletion_reason column (why user was deleted)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add deactivated_at column (when account was deactivated)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- CREATE INDEXES for better query performance
-- ============================================

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_moderated_by ON products(moderated_by);
CREATE INDEX IF NOT EXISTS idx_products_moderated_at ON products(moderated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status_moderated ON products(status, moderated_at DESC);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_status_role ON profiles(status, role);

-- ============================================
-- UPDATE EXISTING DATA (if needed)
-- ============================================

-- Set default status for existing products that don't have status
UPDATE products 
SET status = CASE 
    WHEN is_sold = true THEN 'sold'
    WHEN status IS NULL THEN 'active'
    ELSE status
END
WHERE status IS NULL;

-- Set default status for existing profiles that don't have status
UPDATE profiles 
SET status = 'active'
WHERE status IS NULL;

-- Set default role for existing profiles that don't have role
UPDATE profiles 
SET role = 'user'
WHERE role IS NULL;

-- ============================================
-- COMMENTS for documentation
-- ============================================

COMMENT ON COLUMN products.moderated_by IS 'ID of admin who moderated this product';
COMMENT ON COLUMN products.moderated_at IS 'Timestamp when product was moderated';
COMMENT ON COLUMN products.moderation_note IS 'Admin notes/reason for moderation action';
COMMENT ON COLUMN products.status IS 'Product status: active, pending, rejected, inactive, deleted, deactivated, sold, expired';

COMMENT ON COLUMN profiles.status IS 'User account status: active, banned, suspended, deactivated, deleted';
COMMENT ON COLUMN profiles.role IS 'User role: user, admin, super_admin, owner';
COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp when account was soft deleted';
COMMENT ON COLUMN profiles.deletion_reason IS 'Reason for account deletion';
COMMENT ON COLUMN profiles.deactivated_at IS 'Timestamp when account was deactivated';

