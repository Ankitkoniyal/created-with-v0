-- Add missing columns to products table
-- Only add columns if they don't already exist to avoid errors

-- Add postal_code column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'postal_code') THEN
        ALTER TABLE products ADD COLUMN postal_code VARCHAR(10);
    END IF;
END $$;

-- Add location column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'location') THEN
        ALTER TABLE products ADD COLUMN location TEXT;
    END IF;
END $$;

-- Add price_type column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_type') THEN
        ALTER TABLE products ADD COLUMN price_type VARCHAR(20) DEFAULT 'fixed';
    END IF;
END $$;

-- Add youtube_url column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'youtube_url') THEN
        ALTER TABLE products ADD COLUMN youtube_url TEXT;
    END IF;
END $$;

-- Add website_url column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'website_url') THEN
        ALTER TABLE products ADD COLUMN website_url TEXT;
    END IF;
END $$;

-- Add show_mobile_number column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'show_mobile_number') THEN
        ALTER TABLE products ADD COLUMN show_mobile_number BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add tags column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
        ALTER TABLE products ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Add subcategory column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'subcategory') THEN
        ALTER TABLE products ADD COLUMN subcategory VARCHAR(100);
    END IF;
END $$;
