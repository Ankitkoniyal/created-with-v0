-- Create notifications table for user notifications
-- This table stores all notifications for users (ad approvals, rejections, messages, etc.)

-- Drop table if exists to recreate with correct schema
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'new_ad', 'ad_status_change', 'ad_removed', 'message', 'system')),
  link TEXT,
  "read" BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical', 'success')),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_type;

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, "read");
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing policies first)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Super admins can view all notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications (handled via service role key in API routes)
-- Note: Insert is typically done via service role, but we allow users to insert their own for flexibility
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Super admins can view all notifications (for admin purposes)
CREATE POLICY "Super admins can view all notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'owner')
    )
  );

-- Add comment to table
COMMENT ON TABLE notifications IS 'Stores user notifications for ad status changes, messages, and system updates';

