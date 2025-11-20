-- Add category-specific fields to products table
-- This enables smart filtering for vehicles, real estate, and other categories

-- Vehicles fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
ADD COLUMN IF NOT EXISTS mileage INTEGER CHECK (mileage >= 0),
ADD COLUMN IF NOT EXISTS fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'plug-in-hybrid', 'other')),
ADD COLUMN IF NOT EXISTS transmission TEXT CHECK (transmission IN ('automatic', 'manual', 'cvt')),
ADD COLUMN IF NOT EXISTS body_type TEXT CHECK (body_type IN ('sedan', 'suv', 'truck', 'coupe', 'convertible', 'hatchback', 'wagon', 'van', 'motorcycle', 'other'));

-- Real Estate fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS property_type TEXT CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'duplex', 'studio', 'land', 'commercial', 'other')),
ADD COLUMN IF NOT EXISTS bedrooms INTEGER CHECK (bedrooms >= 0 AND bedrooms <= 20),
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC(3,1) CHECK (bathrooms >= 0 AND bathrooms <= 20),
ADD COLUMN IF NOT EXISTS square_feet INTEGER CHECK (square_feet >= 0),
ADD COLUMN IF NOT EXISTS lot_size INTEGER CHECK (lot_size >= 0);

-- Electronics & General fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS storage TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS material TEXT CHECK (material IN ('wood', 'metal', 'fabric', 'leather', 'glass', 'plastic', 'mixed', 'other')),
ADD COLUMN IF NOT EXISTS size TEXT;

-- Create indexes for better filter performance
CREATE INDEX IF NOT EXISTS idx_products_year ON products(year) WHERE year IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_mileage ON products(mileage) WHERE mileage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_fuel_type ON products(fuel_type) WHERE fuel_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_transmission ON products(transmission) WHERE transmission IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_body_type ON products(body_type) WHERE body_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_property_type ON products(property_type) WHERE property_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_bedrooms ON products(bedrooms) WHERE bedrooms IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_bathrooms ON products(bathrooms) WHERE bathrooms IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_square_feet ON products(square_feet) WHERE square_feet IS NOT NULL;

-- Verify the migration
SELECT 'Category-specific fields added successfully!' as status;





