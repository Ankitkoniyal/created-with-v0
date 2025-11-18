-- Step 1: Clear all incorrect data from locations table
TRUNCATE TABLE public.locations;

-- After running this, import the corrected CSV file via Supabase UI
-- Then verify with:
-- SELECT city, province FROM public.locations 
-- WHERE city IN ('Toronto','Montréal','Calgary','Ottawa','Vancouver') 
-- ORDER BY population DESC;

