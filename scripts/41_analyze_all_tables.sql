-- Comprehensive analysis of all tables in Supabase
-- This script identifies which tables are used and which might be safe to delete

-- 1. List ALL tables in the public schema with row counts
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get row counts for each table (this might take a moment)
-- Note: Some tables might be large, so this could be slow
SELECT 
    'profiles' as table_name,
    (SELECT COUNT(*) FROM public.profiles) as row_count
UNION ALL
SELECT 'products', (SELECT COUNT(*) FROM public.products)
UNION ALL
SELECT 'categories', (SELECT COUNT(*) FROM public.categories)
UNION ALL
SELECT 'subcategories', (SELECT COUNT(*) FROM public.subcategories)
UNION ALL
SELECT 'favorites', (SELECT COUNT(*) FROM public.favorites)
UNION ALL
SELECT 'messages', (SELECT COUNT(*) FROM public.messages)
UNION ALL
SELECT 'notifications', (SELECT COUNT(*) FROM public.notifications)
UNION ALL
SELECT 'locations', (SELECT COUNT(*) FROM public.locations)
UNION ALL
SELECT 'user_ratings', (SELECT COUNT(*) FROM public.user_ratings)
UNION ALL
SELECT 'user_rating_stats', (SELECT COUNT(*) FROM public.user_rating_stats)
UNION ALL
SELECT 'user_comments', (SELECT COUNT(*) FROM public.user_comments)
UNION ALL
SELECT 'reports', (SELECT COUNT(*) FROM public.reports)
UNION ALL
SELECT 'platform_settings', (SELECT COUNT(*) FROM public.platform_settings)
UNION ALL
SELECT 'banned_users', (SELECT COUNT(*) FROM public.banned_users)
UNION ALL
SELECT 'deactivated_ads', (SELECT COUNT(*) FROM public.deactivated_ads)
UNION ALL
SELECT 'moderation_logs', (SELECT COUNT(*) FROM public.moderation_logs)
UNION ALL
SELECT 'audit_logs', (SELECT COUNT(*) FROM public.audit_logs)
UNION ALL
SELECT 'admin_audit_log', (SELECT COUNT(*) FROM public.admin_audit_log)
UNION ALL
SELECT 'conversations', (SELECT COUNT(*) FROM public.conversations)
UNION ALL
SELECT 'localities', (SELECT COUNT(*) FROM public.localities)
UNION ALL
SELECT 'staging_geonames_ca', (SELECT COUNT(*) FROM public.staging_geonames_ca)
UNION ALL
SELECT 'province_code_map', (SELECT COUNT(*) FROM public.province_code_map)
ORDER BY table_name;

-- 3. Check for tables that might exist but aren't in our list above
-- This will help identify any tables we might have missed
SELECT 
    t.tablename as potential_unused_table,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.tablename) as column_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT IN (
    'profiles', 'products', 'categories', 'subcategories', 'favorites', 
    'messages', 'notifications', 'locations', 'user_ratings', 'user_rating_stats',
    'user_comments', 'reports', 'platform_settings', 'banned_users', 
    'deactivated_ads', 'moderation_logs', 'audit_logs', 'admin_audit_log',
    'conversations', 'localities', 'staging_geonames_ca', 'province_code_map'
  )
ORDER BY t.tablename;

-- 4. Summary: Tables that are SAFE TO DELETE (staging/temporary)
-- Based on codebase analysis, these are confirmed staging tables:
SELECT 
    'staging_geonames_ca' as table_name,
    'Staging table for GeoNames import - data already in locations table' as reason,
    'SAFE TO DELETE' as recommendation
UNION ALL
SELECT 
    'province_code_map',
    'Mapping table for GeoNames import - no longer needed after import',
    'SAFE TO DELETE';

-- 5. Check for foreign key dependencies before deletion
-- This shows which tables reference the staging tables (should be none)
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (ccu.table_name IN ('staging_geonames_ca', 'province_code_map')
       OR tc.table_name IN ('staging_geonames_ca', 'province_code_map'));

