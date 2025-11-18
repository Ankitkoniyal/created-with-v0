-- Test if Barrie and Guelph exist in the database
SELECT city, province, population, search_text
FROM public.locations
WHERE LOWER(city) IN ('barrie', 'guelph')
ORDER BY population DESC;

-- Test the exact query pattern used in the header component
-- Simulate searching for "barrie"
SELECT city, province, population
FROM public.locations
WHERE city ILIKE '%barrie%'
ORDER BY population DESC NULLS LAST
LIMIT 8;

-- Simulate searching for "guelph"
SELECT city, province, population
FROM public.locations
WHERE city ILIKE '%guelph%'
ORDER BY population DESC NULLS LAST
LIMIT 8;

-- Test partial search (like typing "barr")
SELECT city, province, population
FROM public.locations
WHERE city ILIKE '%barr%'
ORDER BY population DESC NULLS LAST
LIMIT 8;

-- Check if there are any cities with similar names
SELECT city, province, population
FROM public.locations
WHERE city ILIKE '%bar%' OR city ILIKE '%guel%'
ORDER BY population DESC
LIMIT 20;

