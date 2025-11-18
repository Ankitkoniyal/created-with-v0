-- Migration: Drop user_comments table
-- Reason: Comments are now integrated into user_ratings table (comment field)
-- This table is no longer needed as comments are part of the ratings system
--
-- IMPORTANT: This will permanently delete all data in the user_comments table
-- Make sure you've migrated any important comments to user_ratings before running this

-- Drop RLS policies first
DROP POLICY IF EXISTS "Anyone can read comments" ON user_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON user_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON user_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON user_comments;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_comments_to_user;
DROP INDEX IF EXISTS idx_user_comments_from_user;
DROP INDEX IF EXISTS idx_user_comments_created_at;

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_comments_updated_at ON user_comments;

-- Drop the table
DROP TABLE IF EXISTS user_comments CASCADE;

-- Verify the table has been dropped
SELECT 'user_comments table has been successfully dropped. Comments are now only in user_ratings table.' as status;

