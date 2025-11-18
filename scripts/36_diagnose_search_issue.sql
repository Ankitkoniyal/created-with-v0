-- Diagnose why some cities aren't showing in search

-- 1. Check if Barrie and Guelph exist in the table
SELECT city, province, population, search_text
FROM public.locations
WHERE LOWER(city) IN ('barrie', 'guelph')
ORDER BY population DESC;

-- 2. Test the exact query used in the header component
-- Simulate searching for "barrie"
SELECT city, province, population, search_text
FROM public.locations
WHERE search_text ILIKE '%barrie%'
ORDER BY population DESC
LIMIT 8;

-- Simulate searching for "guelph"
SELECT city, province, population, search_text
FROM public.locations
WHERE search_text ILIKE '%guelph%'
ORDER BY population DESC
LIMIT 8;

-- 3. Check if search_text column is populated (should be auto-generated)
SELECT 
    COUNT(*) as total_rows,
    COUNT(search_text) as rows_with_search_text,
    COUNT(*) - COUNT(search_text) as rows_missing_search_text
FROM public.locations;

-- 4. Sample of search_text values to verify format
SELECT city, province, search_text
FROM public.locations
WHERE LOWER(city) IN ('barrie', 'guelph', 'toronto', 'vancouver')
ORDER BY city;

-- 5. Test partial search (like typing "barr")
SELECT city, province, population
FROM public.locations
WHERE search_text ILIKE '%barr%'
ORDER BY population DESC
LIMIT 8;

