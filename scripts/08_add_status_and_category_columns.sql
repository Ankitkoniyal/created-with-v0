-- Add missing columns to products table

-- Add status column with enum values
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'sold', 'inactive', 'pending'));

-- Add category column to store category name directly (denormalized for performance)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing products to set status based on is_sold
UPDATE products 
SET status = CASE 
  WHEN is_sold = true THEN 'sold'
  ELSE 'active'
END
WHERE status IS NULL;

-- Update existing products to set category name from categories table
UPDATE products 
SET category = categories.name
FROM categories 
WHERE products.category_id = categories.id 
AND products.category IS NULL;

-- Create index for better performance on status and category queries
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Update the trigger function to also handle status updates when is_sold changes
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on is_sold
  IF NEW.is_sold = true AND OLD.is_sold = false THEN
    NEW.status = 'sold';
  ELSIF NEW.is_sold = false AND OLD.is_sold = true THEN
    NEW.status = 'active';
  END IF;
  
  -- Update category name if category_id changed
  IF NEW.category_id != OLD.category_id THEN
    SELECT name INTO NEW.category FROM categories WHERE id = NEW.category_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status and category
DROP TRIGGER IF EXISTS update_product_status_trigger ON products;
CREATE TRIGGER update_product_status_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_status();

-- Create trigger for new products to set category name
CREATE OR REPLACE FUNCTION set_product_category_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set category name from categories table
  SELECT name INTO NEW.category FROM categories WHERE id = NEW.category_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_product_category_on_insert_trigger ON products;
CREATE TRIGGER set_product_category_on_insert_trigger
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION set_product_category_on_insert();
