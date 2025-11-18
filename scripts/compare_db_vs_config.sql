-- Compare database categories/subcategories with lib/categories.ts config
-- This helps identify any mismatches

-- Step 1: List all categories in DB
SELECT '=== CATEGORIES IN DATABASE ===' as info;
SELECT id, name, slug FROM categories ORDER BY name;

-- Step 2: List all subcategories in DB grouped by category
SELECT '=== SUBCATEGORIES IN DATABASE ===' as info;
SELECT 
    c.name as category_name,
    c.slug as category_slug,
    s.name as subcategory_name,
    s.slug as subcategory_slug,
    s.category_slug
FROM subcategories s
JOIN categories c ON c.slug = s.category_slug
ORDER BY c.name, s.name;

-- Step 3: Count subcategories per category
SELECT '=== SUBCATEGORY COUNT PER CATEGORY ===' as info;
SELECT 
    c.name as category_name,
    COUNT(s.id) as subcategory_count
FROM categories c
LEFT JOIN subcategories s ON s.category_slug = c.slug
GROUP BY c.id, c.name
ORDER BY c.name;

-- Step 4: Check for subcategories that might have naming differences
-- (Compare with expected names from lib/categories.ts)
SELECT '=== POTENTIAL NAMING MISMATCHES ===' as info;
SELECT 
    s.name as db_subcategory_name,
    s.slug as db_subcategory_slug,
    c.name as category_name,
    CASE 
        WHEN s.name = 'Fiction' THEN '⚠️ Config has "Fiction Books"'
        WHEN s.name = 'Other' AND s.slug LIKE 'other-%' THEN '✅ OK (Other subcategory)'
        WHEN s.name = 'Other Pets' THEN '⚠️ Config has "Other Pets & Animals"'
        ELSE '✅ OK'
    END as status
FROM subcategories s
JOIN categories c ON c.slug = s.category_slug
WHERE s.name IN ('Fiction', 'Other Pets')
   OR (s.name = 'Other' AND s.slug NOT LIKE 'other-%')
ORDER BY c.name, s.name;

