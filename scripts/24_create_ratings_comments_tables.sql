-- Create tables for user ratings and comments
-- This allows users to rate and comment on other users

-- Ratings table: stores numerical ratings (1-5 stars) from one user to another
CREATE TABLE IF NOT EXISTS user_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate ratings (one user can only rate another user once)
    UNIQUE(from_user_id, to_user_id)
);

-- Comments table: stores text comments from one user to another
CREATE TABLE IF NOT EXISTS user_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL CHECK (LENGTH(comment_text) > 0 AND LENGTH(comment_text) <= 2000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Optional: allow multiple comments but with rate limiting
    -- Or enforce one comment per user: UNIQUE(from_user_id, to_user_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_ratings_to_user ON user_ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_from_user ON user_ratings(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_created_at ON user_ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_comments_to_user ON user_comments(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_comments_from_user ON user_comments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_comments_created_at ON user_comments(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_user_ratings_updated_at
    BEFORE UPDATE ON user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_comments_updated_at
    BEFORE UPDATE ON user_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_ratings
-- Anyone can read ratings (to see other users' ratings)
CREATE POLICY "Anyone can read ratings"
    ON user_ratings FOR SELECT
    USING (true);

-- Users can create ratings (only for themselves, must be authenticated)
CREATE POLICY "Authenticated users can create ratings"
    ON user_ratings FOR INSERT
    WITH CHECK (auth.uid() = from_user_id AND auth.uid() IS NOT NULL);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
    ON user_ratings FOR UPDATE
    USING (auth.uid() = from_user_id)
    WITH CHECK (auth.uid() = from_user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
    ON user_ratings FOR DELETE
    USING (auth.uid() = from_user_id);

-- RLS Policies for user_comments
-- Anyone can read comments (to see other users' comments)
CREATE POLICY "Anyone can read comments"
    ON user_comments FOR SELECT
    USING (true);

-- Users can create comments (only for themselves, must be authenticated)
CREATE POLICY "Authenticated users can create comments"
    ON user_comments FOR INSERT
    WITH CHECK (auth.uid() = from_user_id AND auth.uid() IS NOT NULL);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
    ON user_comments FOR UPDATE
    USING (auth.uid() = from_user_id)
    WITH CHECK (auth.uid() = from_user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON user_comments FOR DELETE
    USING (auth.uid() = from_user_id);

-- View to calculate average rating for each user
CREATE OR REPLACE VIEW user_rating_stats AS
SELECT 
    to_user_id,
    COUNT(*) as total_ratings,
    ROUND(AVG(rating), 2) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
FROM user_ratings
GROUP BY to_user_id;

-- Grant necessary permissions
GRANT SELECT ON user_rating_stats TO authenticated;
GRANT SELECT ON user_rating_stats TO anon;

