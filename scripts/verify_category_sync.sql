-- Verification script to check if categories in database match lib/categories.ts
-- This script does NOT modify anything, it only reports mismatches

-- Step 1: List all categories in database
SELECT 
    'DATABASE CATEGORIES' as source,
    name,
    slug,
    created_at
FROM categories
ORDER BY name;

-- Step 2: Check for categories that might have naming mismatches
-- (This compares against expected names from lib/categories.ts)
SELECT 
    CASE 
        WHEN name = 'Fashion' THEN '⚠️ Should be "Fashion & Beauty"'
        WHEN name = 'Pets' THEN '⚠️ Should be "Pets & Animals"'
        WHEN name = 'Books' THEN '⚠️ Should be "Books & Education"'
        WHEN name = 'Other' THEN '⚠️ Should be "Free Stuff"'
        WHEN slug = 'jobs' OR name = 'Jobs' THEN '⚠️ "Jobs" not in lib/categories.ts'
        ELSE '✅ OK'
    END as status,
    name,
    slug
FROM categories
WHERE name IN ('Fashion', 'Pets', 'Books', 'Other', 'Jobs')
   OR slug IN ('fashion', 'pets', 'books', 'other', 'jobs');

-- Step 3: Check for missing categories (expected from lib/categories.ts)
-- Expected categories: Home Appliances, Electronics, Services, Vehicles, Furniture, 
-- Mobile, Real Estate, Fashion & Beauty, Pets & Animals, Sports, Books & Education, Free Stuff
SELECT 
    'MISSING CATEGORY' as status,
    expected.name as expected_name,
    expected.slug as expected_slug
FROM (VALUES
    ('Home Appliances', 'home-appliances'),
    ('Electronics', 'electronics'),
    ('Services', 'services'),
    ('Vehicles', 'vehicles'),
    ('Furniture', 'furniture'),
    ('Mobile', 'mobile'),
    ('Real Estate', 'real-estate'),
    ('Fashion & Beauty', 'fashion-beauty'),
    ('Pets & Animals', 'pets-animals'),
    ('Sports', 'sports'),
    ('Books & Education', 'books-education'),
    ('Free Stuff', 'free-stuff')
) AS expected(name, slug)
LEFT JOIN categories c ON c.slug = expected.slug OR c.name = expected.name
WHERE c.id IS NULL;

-- Step 4: Summary count
SELECT 
    (SELECT COUNT(*) FROM categories) as total_categories_in_db,
    (SELECT COUNT(*) FROM categories WHERE name IN ('Fashion', 'Pets', 'Books', 'Other', 'Jobs') 
        OR slug IN ('fashion', 'pets', 'books', 'other', 'jobs')) as potential_mismatches,
    (SELECT COUNT(*) FROM (VALUES
        ('Home Appliances', 'home-appliances'),
        ('Electronics', 'electronics'),
        ('Services', 'services'),
        ('Vehicles', 'vehicles'),
        ('Furniture', 'furniture'),
        ('Mobile', 'mobile'),
        ('Real Estate', 'real-estate'),
        ('Fashion & Beauty', 'fashion-beauty'),
        ('Pets & Animals', 'pets-animals'),
        ('Sports', 'sports'),
        ('Books & Education', 'books-education'),
        ('Free Stuff', 'free-stuff')
    ) AS expected(name, slug)
    LEFT JOIN categories c ON c.slug = expected.slug OR c.name = expected.name
    WHERE c.id IS NULL) as missing_categories;

-- Step 5: Check products using old category names
SELECT 
    'PRODUCTS WITH OLD CATEGORY NAMES' as status,
    category,
    COUNT(*) as product_count
FROM products
WHERE category IN ('Fashion', 'Pets', 'Books', 'Other', 'Jobs')
GROUP BY category
ORDER BY product_count DESC;

