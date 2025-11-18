-- Add index on city column for faster ILIKE searches
-- This will improve the location autocomplete performance

CREATE INDEX IF NOT EXISTS idx_locations_city_ilike
  ON public.locations (LOWER(city) text_pattern_ops);

-- Also ensure the trigram index exists for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_locations_city_trgm
  ON public.locations USING GIN (LOWER(city) gin_trgm_ops);

-- Verify indexes exist
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'locations' 
ORDER BY indexname;

