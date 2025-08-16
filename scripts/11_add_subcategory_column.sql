-- Add missing subcategory column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Update RLS policies for products table to allow authenticated users to insert
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
CREATE POLICY "Public read access for product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploaded images
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
