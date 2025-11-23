-- Fix status default to 'pending' instead of 'active'
-- This ensures new ads require admin approval before going live

-- Change the default value for status column
ALTER TABLE products 
ALTER COLUMN status SET DEFAULT 'pending';

-- Update the CHECK constraint to ensure 'pending' is allowed
-- (It should already be there, but let's make sure)
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_status_check;

ALTER TABLE products 
ADD CONSTRAINT products_status_check 
CHECK (status IN ('active', 'sold', 'inactive', 'pending', 'rejected', 'deleted'));

-- Add comment explaining the default
COMMENT ON COLUMN products.status IS 'Product status: pending (requires approval), active (published), sold, inactive, rejected, or deleted. Default is pending for new ads.';

-- Note: Existing products with status='active' will remain active
-- Only NEW products will default to 'pending'

