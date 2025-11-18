-- Check how many cities we have and their population range
SELECT 
    COUNT(*) as total_cities,
    MIN(population) as min_population,
    MAX(population) as max_population,
    AVG(population)::INT as avg_population
FROM public.locations;

-- Check if specific common cities exist
SELECT city, province, population
FROM public.locations
WHERE LOWER(city) IN (
    'toronto', 'montreal', 'montréal', 'vancouver', 'calgary', 'edmonton',
    'ottawa', 'winnipeg', 'mississauga', 'brampton', 'hamilton', 'london',
    'markham', 'surrey', 'richmond', 'oshawa', 'windsor', 'kitchener',
    'halifax', 'victoria', 'saskatoon', 'regina', 'barrie', 'kelowna',
    'guelph', 'thunder bay', 'sudbury', 'kingston', 'sherbrooke', 'red deer'
)
ORDER BY population DESC;

