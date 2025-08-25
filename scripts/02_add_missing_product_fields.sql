-- Add missing fields to products table for better data organization
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Rename images to image_urls for consistency with component expectations
ALTER TABLE products RENAME COLUMN images TO image_urls;

-- Add index for better search performance on brand and model
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_model ON products(model);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
