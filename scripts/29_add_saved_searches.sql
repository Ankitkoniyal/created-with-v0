-- Create saved_searches table for users to save search criteria and get alerts
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- User-friendly name for the search
  search_query TEXT, -- Search keyword
  category TEXT,
  subcategory TEXT,
  location TEXT,
  province TEXT,
  city TEXT,
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  condition TEXT,
  filters JSONB DEFAULT '{}'::jsonb, -- Store additional filters as JSON
  is_active BOOLEAN DEFAULT TRUE,
  email_alerts BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, search_query, category, location) -- Prevent duplicate searches
);

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_searches
CREATE POLICY "Users can view own saved searches" ON saved_searches 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved searches" ON saved_searches 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches" ON saved_searches 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches" ON saved_searches 
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = TRUE;

