# Removing user_comments Table

## Summary

The `user_comments` table is no longer needed because:
1. Comments are now integrated into the `user_ratings` table (there's a `comment` field in user_ratings)
2. The UserComments component has been removed from the seller profile page
3. The comments tab has been removed from the seller profile

## Changes Made

### ✅ 1. Updated Backup/Restore Routes
- Removed `user_comments` from backup route (`app/api/admin/backup/route.ts`)
- Removed `user_comments` from restore route (`app/api/admin/backup/restore/route.ts`)

### ✅ 2. Created Migration Script
- Created `scripts/27_drop_user_comments_table.sql` to safely drop the table

### ⚠️ 3. API Route Still Exists (Deprecated)
- `app/api/comments/route.ts` still exists but is not being used
- Can be deleted if desired, but keeping it won't hurt (just unused code)

### ⚠️ 4. Component Still Exists (Unused)
- `components/user-comments.tsx` still exists but is not being imported/used
- Can be deleted if desired

## Next Steps

### To Complete the Removal:

1. **Run the migration script** in Supabase SQL Editor:
   ```sql
   -- Run scripts/27_drop_user_comments_table.sql
   ```

2. **Optional: Delete unused files**:
   - `app/api/comments/route.ts` (if you want to clean up)
   - `components/user-comments.tsx` (if you want to clean up)

3. **Verify**: Check Supabase that `user_comments` table is gone

## What's Still Needed

✅ **Keep these**:
- `user_ratings` table - Main table with ratings and comments
- `user_rating_stats` view - Aggregated statistics (better performance)

## Database State After Migration

- ✅ `user_ratings` - Stores ratings + comments (integrated)
- ✅ `user_rating_stats` - VIEW for aggregated stats
- ❌ `user_comments` - REMOVED (no longer needed)

