-- Add complete vehicle-specific fields to products table
-- This script adds all missing vehicle filter fields

-- Step 1: Add missing vehicle fields (without constraints first)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS kilometer_driven INTEGER,
ADD COLUMN IF NOT EXISTS seating_capacity INTEGER,
ADD COLUMN IF NOT EXISTS car_type TEXT,
ADD COLUMN IF NOT EXISTS posted_by TEXT;

-- Step 2: Add fuel_type if it doesn't exist (from script 28)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS fuel_type TEXT;

-- Step 3: Add transmission if it doesn't exist (from script 28)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS transmission TEXT;

-- Step 4: Add year if it doesn't exist (from script 28)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS year INTEGER;

-- Step 5: Now add/update constraints
-- Drop existing constraints if they exist
DO $$ 
BEGIN
    -- Drop fuel_type constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_fuel_type_check'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_fuel_type_check;
    END IF;
    
    -- Drop transmission constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_transmission_check'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_transmission_check;
    END IF;
    
    -- Drop other constraints if they exist
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_kilometer_driven_check'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_kilometer_driven_check;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_seating_capacity_check'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_seating_capacity_check;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_car_type_check'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_car_type_check;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_posted_by_check'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_posted_by_check;
    END IF;
END $$;

-- Step 6: Add all constraints
ALTER TABLE products
ADD CONSTRAINT products_fuel_type_check 
CHECK (fuel_type IS NULL OR fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'plug-in-hybrid', 'cng', 'lpg', 'other'));

ALTER TABLE products
ADD CONSTRAINT products_transmission_check 
CHECK (transmission IS NULL OR transmission IN ('automatic', 'manual', 'cvt', 'amt'));

ALTER TABLE products
ADD CONSTRAINT products_kilometer_driven_check 
CHECK (kilometer_driven IS NULL OR kilometer_driven >= 0);

ALTER TABLE products
ADD CONSTRAINT products_seating_capacity_check 
CHECK (seating_capacity IS NULL OR (seating_capacity >= 2 AND seating_capacity <= 20));

ALTER TABLE products
ADD CONSTRAINT products_car_type_check 
CHECK (car_type IS NULL OR car_type IN ('sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'wagon', 'truck', 'van', 'pickup', 'motorcycle', 'scooter', 'bicycle', 'other'));

ALTER TABLE products
ADD CONSTRAINT products_posted_by_check 
CHECK (posted_by IS NULL OR posted_by IN ('owner', 'dealer'));

-- Step 7: Create indexes for better filter performance
CREATE INDEX IF NOT EXISTS idx_products_kilometer_driven ON products(kilometer_driven) WHERE kilometer_driven IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_seating_capacity ON products(seating_capacity) WHERE seating_capacity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_car_type ON products(car_type) WHERE car_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_posted_by ON products(posted_by) WHERE posted_by IS NOT NULL;

-- Verify the migration
SELECT 'Vehicle-specific fields added successfully!' as status;

