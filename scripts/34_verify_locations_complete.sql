-- Final verification: Check that location data is complete and correct

-- 1. Total count of locations
SELECT COUNT(*) as total_locations FROM public.locations;

-- 2. Top 20 cities by population (should show major Canadian cities)
SELECT city, province, population
FROM public.locations
ORDER BY population DESC NULLS LAST
LIMIT 20;

-- 3. Verify major cities have correct provinces
SELECT city, province, population
FROM public.locations
WHERE city IN (
    'Toronto', 'Montréal', 'Vancouver', 'Calgary', 'Edmonton', 
    'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener',
    'London', 'Halifax', 'Victoria', 'Windsor', 'Saskatoon'
)
ORDER BY population DESC;

-- 4. Check search functionality (fuzzy search test)
SELECT city, province, population
FROM public.locations
WHERE search_text ILIKE '%toron%'
ORDER BY population DESC
LIMIT 10;

-- 5. Check provinces distribution
SELECT province, COUNT(*) as city_count
FROM public.locations
GROUP BY province
ORDER BY city_count DESC;

