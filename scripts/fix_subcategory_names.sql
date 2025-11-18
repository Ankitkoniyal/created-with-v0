-- Fix subcategory naming mismatches to match lib/categories.ts
-- This script updates the database to match the config file

-- IMPORTANT: This will also update any products using these subcategories

-- Fix 1: Update "Fiction" to "Fiction Books" (slug stays the same: fiction-books)
UPDATE subcategories 
SET name = 'Fiction Books'
WHERE name = 'Fiction' AND slug = 'fiction-books' AND category_slug = 'books-education';

-- Fix 2: Handle "Other Pets" to "Other Pets & Animals"
-- First, check if "other-pets-animals" already exists
-- If it exists, we'll update products to use it and delete the old "other-pets" entry
-- If it doesn't exist, we'll update the "other-pets" entry

-- Step 2a: Update any products using the old "other-pets" slug to use "other-pets-animals"
UPDATE products 
SET subcategory = 'other-pets-animals'
WHERE subcategory = 'other-pets';

-- Step 2b: If "other-pets-animals" already exists, just delete the old "other-pets" entry
-- If it doesn't exist, update the "other-pets" entry
DO $$
BEGIN
    -- Check if "other-pets-animals" already exists
    IF EXISTS (SELECT 1 FROM subcategories WHERE slug = 'other-pets-animals' AND category_slug = 'pets-animals') THEN
        -- Update the existing "other-pets-animals" to ensure name is correct
        UPDATE subcategories 
        SET name = 'Other Pets & Animals'
        WHERE slug = 'other-pets-animals' AND category_slug = 'pets-animals';
        
        -- Delete the old "other-pets" entry
        DELETE FROM subcategories 
        WHERE name = 'Other Pets' AND slug = 'other-pets' AND category_slug = 'pets-animals';
    ELSE
        -- Update the "other-pets" entry to new name and slug
        UPDATE subcategories 
        SET name = 'Other Pets & Animals',
            slug = 'other-pets-animals'
        WHERE name = 'Other Pets' AND slug = 'other-pets' AND category_slug = 'pets-animals';
    END IF;
END $$;

-- Verify the changes
SELECT 
    '✅ VERIFICATION - Updated Subcategories' as info,
    s.name as subcategory_name,
    s.slug as subcategory_slug,
    c.name as category_name
FROM subcategories s
JOIN categories c ON c.slug = s.category_slug
WHERE s.name IN ('Fiction Books', 'Other Pets & Animals')
ORDER BY c.name, s.name;

-- Check if any products were affected
SELECT 
    '📊 Products Updated' as info,
    subcategory,
    COUNT(*) as product_count
FROM products
WHERE subcategory IN ('fiction-books', 'other-pets-animals')
GROUP BY subcategory;

