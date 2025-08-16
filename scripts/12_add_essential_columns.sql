-- Add essential columns for enhanced product posting functionality
-- This script adds only the most critical missing columns

-- Add location and postal code columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Add price type column for flexible pricing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'amount' CHECK (price_type IN ('amount', 'free', 'contact', 'swap'));

-- Add media columns for YouTube and website links
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add mobile number visibility flag
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_mobile_number BOOLEAN DEFAULT FALSE;

-- Add tags column as JSON array
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Update RLS policies to allow authenticated users to insert their own products
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update RLS policies to allow authenticated users to view all products
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

-- Update RLS policies to allow users to update their own products
DROP POLICY IF EXISTS "Users can update their own products" ON products;
CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

-- Update RLS policies to allow users to delete their own products
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure RLS is enabled on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
