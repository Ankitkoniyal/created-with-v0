-- Check if RLS is enabled on locations table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'locations';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'locations';

-- Disable RLS or create a policy to allow public read access
-- Option 1: Disable RLS (simplest for public data)
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, create a policy for public read access
-- CREATE POLICY "Allow public read access" ON public.locations
--     FOR SELECT
--     USING (true);

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'locations';

