-- Cleanup staging tables that are no longer needed
-- These were only used during the GeoNames import process
-- Since data is now in public.locations, we can safely delete them

-- Check if tables exist and their row counts
SELECT 
    'staging_geonames_ca' as table_name,
    COUNT(*) as row_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'staging_geonames_ca'
UNION ALL
SELECT 
    'province_code_map' as table_name,
    COUNT(*) as row_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'province_code_map';

-- Drop staging tables (safe to delete - data is already in locations table)
DROP TABLE IF EXISTS public.staging_geonames_ca;
DROP TABLE IF EXISTS public.province_code_map;

-- Verify they're deleted
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('staging_geonames_ca', 'province_code_map');

-- If the query above returns no rows, the tables are successfully deleted

