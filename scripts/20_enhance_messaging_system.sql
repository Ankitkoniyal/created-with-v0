-- Enhanced Messaging System for Real-time Chat
-- This script enhances the existing messages table and adds conversations support

-- Create conversations table to group messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Optional: can be null for general conversations
  participant_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  participant_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1, participant_2, product_id), -- Prevent duplicate conversations
  CHECK (participant_1 != participant_2) -- Users can't chat with themselves
);

-- Add conversation_id to existing messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Add message type and status fields for better chat functionality
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'));

-- Add foreign key constraint for last_message_id in conversations
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message 
  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view own conversations" ON conversations 
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations" ON conversations 
  FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update own conversations" ON conversations 
  FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Update messages RLS policies to work with conversations
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

CREATE POLICY "Users can view conversation messages" ON messages 
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    (conversation_id IS NULL OR EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    ))
  );

CREATE POLICY "Users can update message status" ON messages 
  FOR UPDATE USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_product_id ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Create function to update conversation last_message info
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE conversations 
    SET 
      last_message_id = NEW.id,
      last_message_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update conversation on new message
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW 
  WHEN (NEW.conversation_id IS NOT NULL)
  EXECUTE FUNCTION update_conversation_last_message();

-- Create function to automatically create conversation if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_conversation_exists()
RETURNS TRIGGER AS $$
DECLARE
  conv_id UUID;
  participant_1_id UUID;
  participant_2_id UUID;
BEGIN
  -- If conversation_id is already set, do nothing
  IF NEW.conversation_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine participant order (smaller UUID first for consistency)
  IF NEW.sender_id < NEW.receiver_id THEN
    participant_1_id := NEW.sender_id;
    participant_2_id := NEW.receiver_id;
  ELSE
    participant_1_id := NEW.receiver_id;
    participant_2_id := NEW.sender_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE participant_1 = participant_1_id 
    AND participant_2 = participant_2_id
    AND (product_id = NEW.product_id OR (product_id IS NULL AND NEW.product_id IS NULL));
  
  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2, product_id)
    VALUES (participant_1_id, participant_2_id, NEW.product_id)
    RETURNING id INTO conv_id;
  END IF;
  
  -- Set the conversation_id on the message
  NEW.conversation_id := conv_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure conversation exists before inserting message
DROP TRIGGER IF EXISTS ensure_conversation_before_message ON messages;
CREATE TRIGGER ensure_conversation_before_message
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_conversation_exists();

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid UUID, user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE messages 
  SET 
    status = 'read',
    is_read = true
  WHERE 
    conversation_id = conversation_uuid 
    AND receiver_id = user_uuid 
    AND status != 'read';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories if they don't exist
INSERT INTO categories (name, slug, icon) VALUES
  ('Vehicles', 'vehicles', '🚗'),
  ('Electronics', 'electronics', '📱'),
  ('Home & Garden', 'home-garden', '🏠'),
  ('Fashion', 'fashion', '👕'),
  ('Sports & Recreation', 'sports-recreation', '⚽'),
  ('Books & Media', 'books-media', '📚'),
  ('Jobs', 'jobs', '💼'),
  ('Services', 'services', '🔧')
ON CONFLICT (slug) DO NOTHING;
