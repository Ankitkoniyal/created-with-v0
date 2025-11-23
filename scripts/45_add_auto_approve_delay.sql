-- Add auto_approve_delay_minutes column to platform_settings table
-- This allows admins to set a delay before ads are auto-approved

ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS auto_approve_delay_minutes INTEGER DEFAULT NULL;

-- Create scheduled_approvals table for tracking delayed auto-approvals
CREATE TABLE IF NOT EXISTS scheduled_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  approval_time TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_scheduled_approvals_approval_time ON scheduled_approvals(approval_time) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_scheduled_approvals_product_id ON scheduled_approvals(product_id);

-- Enable RLS
ALTER TABLE scheduled_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role can manage scheduled approvals" ON scheduled_approvals;
CREATE POLICY "Service role can manage scheduled approvals"
  ON scheduled_approvals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_scheduled_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_scheduled_approvals_updated_at ON scheduled_approvals;
CREATE TRIGGER update_scheduled_approvals_updated_at
    BEFORE UPDATE ON scheduled_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_approvals_updated_at();

-- Grant permissions
GRANT ALL ON scheduled_approvals TO authenticated;
GRANT ALL ON scheduled_approvals TO service_role;

