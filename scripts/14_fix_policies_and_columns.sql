-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Add missing columns to products table if they don't exist
DO $$ 
BEGIN
    -- Add postal_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'postal_code') THEN
        ALTER TABLE products ADD COLUMN postal_code VARCHAR(10);
    END IF;
    
    -- Add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'location') THEN
        ALTER TABLE products ADD COLUMN location TEXT;
    END IF;
    
    -- Add price_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_type') THEN
        ALTER TABLE products ADD COLUMN price_type VARCHAR(20) DEFAULT 'fixed';
    END IF;
    
    -- Add youtube_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'youtube_url') THEN
        ALTER TABLE products ADD COLUMN youtube_url TEXT;
    END IF;
    
    -- Add website_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'website_url') THEN
        ALTER TABLE products ADD COLUMN website_url TEXT;
    END IF;
    
    -- Add show_mobile_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'show_mobile_number') THEN
        ALTER TABLE products ADD COLUMN show_mobile_number BOOLEAN DEFAULT false;
    END IF;
    
    -- Add tags column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
        ALTER TABLE products ADD COLUMN tags TEXT[];
    END IF;
    
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    -- Add category column (denormalized for performance)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE products ADD COLUMN category VARCHAR(50);
    END IF;
    
    -- Add subcategory column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'subcategory') THEN
        ALTER TABLE products ADD COLUMN subcategory VARCHAR(50);
    END IF;
    
    -- Add features column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'features') THEN
        ALTER TABLE products ADD COLUMN features TEXT[];
    END IF;
END $$;

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products table
CREATE POLICY "Users can insert their own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own products" ON products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Users can update their own images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Update existing products to have proper status and category values
UPDATE products 
SET 
    status = CASE 
        WHEN is_sold = true THEN 'sold'
        ELSE 'active'
    END,
    category = (SELECT name FROM categories WHERE categories.id = products.category_id)
WHERE status IS NULL OR category IS NULL;
