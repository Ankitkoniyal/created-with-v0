-- Quick check: Does the locations table have any data?
SELECT COUNT(*) as total_locations FROM public.locations;

-- Check a few sample cities
SELECT city, province, population
FROM public.locations
ORDER BY population DESC NULLS LAST
LIMIT 20;

-- Check if major cities exist
SELECT city, province
FROM public.locations
WHERE LOWER(city) IN ('toronto', 'montréal', 'montreal', 'calgary', 'ottawa', 'edmonton', 'winnipeg', 'vancouver', 'brampton', 'hamilton')
ORDER BY population DESC;

