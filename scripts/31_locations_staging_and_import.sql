-- Seed Canadian locations from GeoNames (best long-term, free, scalable)
-- This script prepares a staging table, province mappings, and an import into public.locations.
-- Steps to run:
-- 1) Download GeoNames Canada file: cities500.zip (or allCountries.zip) from https://download.geonames.org/export/dump/
--    Use the "cities500" dataset for ~10–20k populated places (recommended).
-- 2) Unzip and upload the TSV (cities500.txt) to Supabase (Table Editor → Import data → Select file → staging_geonames_ca).
--    Map columns as defined below (tab-separated; UTF-8).
-- 3) Run this script (after scripts/30_create_locations_table.sql).
-- 4) The INSERT ... SELECT at the bottom will upsert into public.locations.

-- 0) Safety: create extension for trigram if not already enabled (done in 30_create_locations_table.sql)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1) Staging table for a subset of GeoNames fields we need
DROP TABLE IF EXISTS public.staging_geonames_ca;
CREATE TABLE public.staging_geonames_ca (
  geonameid BIGINT,
  name TEXT,
  asciiname TEXT,
  alternatenames TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  feature_class TEXT,
  feature_code TEXT,
  country_code TEXT,
  cc2 TEXT,
  admin1_code TEXT,   -- province code (e.g., 01 for NL, 02 for NS...) when country_code = 'CA'
  admin2_code TEXT,
  admin3_code TEXT,
  admin4_code TEXT,
  population BIGINT,
  elevation INT,
  dem INT,
  timezone TEXT,
  modification_date DATE
);

-- 2) Province code → abbreviation mapping for Canada (admin1_code)
DROP TABLE IF EXISTS public.province_code_map;
CREATE TABLE public.province_code_map (
  admin1_code TEXT PRIMARY KEY,
  province TEXT NOT NULL
);

INSERT INTO public.province_code_map (admin1_code, province) VALUES
  ('01','NL'), -- Newfoundland and Labrador
  ('02','NS'), -- Nova Scotia
  ('03','PE'), -- Prince Edward Island
  ('04','NB'), -- New Brunswick
  ('05','QC'), -- Quebec
  ('06','ON'), -- Ontario
  ('07','MB'), -- Manitoba
  ('08','SK'), -- Saskatchewan
  ('09','AB'), -- Alberta
  ('10','BC'), -- British Columbia
  ('11','NU'), -- Nunavut
  ('12','NT'), -- Northwest Territories
  ('13','YT'); -- Yukon

-- 3) Upsert into public.locations from staging (dedup by city+province, keep largest population)
-- Choose your filter. Recommended:
--   a) Only Canadian records (country_code = 'CA')
--   b) Only populated-place feature codes
--   c) Population threshold (e.g., > 500) to keep autocomplete clean; adjust as needed
--   d) Prefer asciiname as city name fallback if name is missing

WITH ranked AS (
  SELECT
    COALESCE(NULLIF(TRIM(s.name), ''), NULLIF(TRIM(s.asciiname), '')) AS city,
    m.province,
    s.latitude AS lat,
    s.longitude AS lng,
    NULLIF(s.population, 0)::INT AS population,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(COALESCE(NULLIF(TRIM(s.name), ''), NULLIF(TRIM(s.asciiname), ''))), LOWER(m.province)
      ORDER BY COALESCE(s.population, 0) DESC NULLS LAST, s.geonameid
    ) AS rn
  FROM public.staging_geonames_ca s
  JOIN public.province_code_map m
    ON s.admin1_code = m.admin1_code
  WHERE s.country_code = 'CA'
    AND s.feature_class = 'P'           -- Populated place
    AND s.feature_code IN (
        'PPLA','PPLA2','PPLA3','PPLA4', -- seats
        'PPLC',                         -- federal/prov capital
        'PPL','PPLG'                    -- populated place / seat of gov
    )
    AND COALESCE(s.population, 0) >= 500
)
INSERT INTO public.locations (city, province, lat, lng, population)
SELECT city, province, lat, lng, population
FROM ranked
WHERE rn = 1 AND city IS NOT NULL
ON CONFLICT (LOWER(city), LOWER(province)) DO UPDATE
SET lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    population = GREATEST(COALESCE(public.locations.population,0), COALESCE(EXCLUDED.population,0));

-- 4) Optional: Vacuum/Analyze for snappy performance
ANALYZE public.locations;

-- Validation queries:
-- SELECT COUNT(*) FROM public.locations;
-- SELECT * FROM public.locations ORDER BY population DESC NULLS LAST LIMIT 20;
-- SELECT * FROM public.locations WHERE search_text ILIKE '%toron%' LIMIT 10;


