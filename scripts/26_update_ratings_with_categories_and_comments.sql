-- Migration: Add category ratings and comments to user_ratings table
-- This updates the rating system to include category-specific ratings and comments

-- Add new columns to user_ratings table
ALTER TABLE user_ratings
ADD COLUMN IF NOT EXISTS response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
ADD COLUMN IF NOT EXISTS product_quality_rating INTEGER CHECK (product_quality_rating >= 1 AND product_quality_rating <= 5),
ADD COLUMN IF NOT EXISTS communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
ADD COLUMN IF NOT EXISTS overall_experience_rating INTEGER CHECK (overall_experience_rating >= 1 AND overall_experience_rating <= 5),
ADD COLUMN IF NOT EXISTS comment TEXT CHECK (char_length(comment) <= 2000);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_ratings_comment ON user_ratings(to_user_id, created_at DESC) WHERE comment IS NOT NULL;

-- Update the user_rating_stats view to include category averages
DROP VIEW IF EXISTS user_rating_stats;
CREATE OR REPLACE VIEW user_rating_stats AS
SELECT 
    to_user_id,
    COUNT(*)::INTEGER as total_ratings,
    ROUND(AVG(rating)::NUMERIC, 2) as average_rating,
    ROUND(AVG(response_time_rating)::NUMERIC, 2) as avg_response_time_rating,
    ROUND(AVG(product_quality_rating)::NUMERIC, 2) as avg_product_quality_rating,
    ROUND(AVG(communication_rating)::NUMERIC, 2) as avg_communication_rating,
    ROUND(AVG(overall_experience_rating)::NUMERIC, 2) as avg_overall_experience_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END)::INTEGER as five_star,
    COUNT(CASE WHEN rating = 4 THEN 1 END)::INTEGER as four_star,
    COUNT(CASE WHEN rating = 3 THEN 1 END)::INTEGER as three_star,
    COUNT(CASE WHEN rating = 2 THEN 1 END)::INTEGER as two_star,
    COUNT(CASE WHEN rating = 1 THEN 1 END)::INTEGER as one_star,
    COUNT(CASE WHEN comment IS NOT NULL AND char_length(comment) > 0 THEN 1 END)::INTEGER as ratings_with_comments
FROM user_ratings
GROUP BY to_user_id;

-- Grant necessary permissions
GRANT SELECT ON user_rating_stats TO authenticated;
GRANT SELECT ON user_rating_stats TO anon;

-- Verify the migration
SELECT 'Migration completed successfully! user_ratings table now supports category ratings and comments.' as status;

