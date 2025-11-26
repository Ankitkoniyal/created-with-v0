-- Create platform_settings table
-- This table stores global application settings controlled by super admins

CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    site_name TEXT NOT NULL DEFAULT 'Marketplace',
    site_description TEXT DEFAULT 'Discover and list local deals',
    site_url TEXT NOT NULL DEFAULT 'https://marketplace.example.com',
    admin_email TEXT NOT NULL DEFAULT 'admin@marketplace.example.com',
    enable_notifications BOOLEAN DEFAULT true,
    enable_email_verification BOOLEAN DEFAULT true,
    enable_user_registration BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    currency TEXT DEFAULT 'USD',
    currency_symbol TEXT DEFAULT '$',
    items_per_page INTEGER DEFAULT 24,
    max_images_per_ad INTEGER DEFAULT 8,
    max_ad_duration INTEGER DEFAULT 30,
    auto_approve_ads BOOLEAN DEFAULT false,
    stripe_enabled BOOLEAN DEFAULT false,
    paypal_enabled BOOLEAN DEFAULT false,
    support_email TEXT DEFAULT 'support@marketplace.example.com',
    terms_url TEXT,
    privacy_url TEXT,
    -- New recommended settings
    require_phone_verification BOOLEAN DEFAULT false,
    allow_anonymous_browsing BOOLEAN DEFAULT true,
    enable_ratings BOOLEAN DEFAULT false, -- Feature on hold, disabled by default
    enable_comments BOOLEAN DEFAULT true,
    max_ads_per_user INTEGER DEFAULT 50,
    featured_ads_enabled BOOLEAN DEFAULT false,
    featured_ads_price NUMERIC(10, 2) DEFAULT 9.99,
    enable_search_suggestions BOOLEAN DEFAULT true,
    min_price NUMERIC(10, 2),
    max_price NUMERIC(10, 2),
    enable_email_alerts BOOLEAN DEFAULT true,
    spam_detection_enabled BOOLEAN DEFAULT true,
    auto_delete_expired_ads BOOLEAN DEFAULT false,
    expired_ads_retention_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO platform_settings (id, site_name, site_description, site_url, admin_email)
VALUES ('global', 'Marketplace', 'Discover and list local deals', 'https://marketplace.example.com', 'admin@marketplace.example.com')
ON CONFLICT (id) DO NOTHING;

-- Create index on id (though it's primary key, this is for clarity)
CREATE INDEX IF NOT EXISTS idx_platform_settings_id ON platform_settings(id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_settings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Only admins can update platform settings" ON platform_settings;

-- RLS Policies
-- Anyone can read platform settings (for maintenance mode check, etc.)
CREATE POLICY "Anyone can read platform settings"
    ON platform_settings FOR SELECT
    USING (true);

-- Only authenticated super admins can update settings
-- Note: You'll need to check user role in your application logic before allowing updates
CREATE POLICY "Only admins can update platform settings"
    ON platform_settings FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated super admins can insert settings
CREATE POLICY "Only admins can insert platform settings"
    ON platform_settings FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT SELECT ON platform_settings TO authenticated;
GRANT SELECT ON platform_settings TO anon;
GRANT UPDATE, INSERT ON platform_settings TO authenticated;

-- Verify the table was created
SELECT 'Platform settings table created successfully!' as status;
SELECT * FROM platform_settings WHERE id = 'global';

