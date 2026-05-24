-- Accountability Buddies table for pairing runners
CREATE TABLE IF NOT EXISTS accountability_buddies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buddy_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure a user can only have one active buddy
  CONSTRAINT unique_active_buddy UNIQUE (user_id, status),
  CONSTRAINT no_self_buddy CHECK (user_id != buddy_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_accountability_buddies_user_id ON accountability_buddies(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_buddies_buddy_id ON accountability_buddies(buddy_id);
CREATE INDEX IF NOT EXISTS idx_accountability_buddies_status ON accountability_buddies(status);

-- Enable RLS
ALTER TABLE accountability_buddies ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can see connections they're part of
CREATE POLICY "Users can view their own buddy connections"
  ON accountability_buddies FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = buddy_id);

CREATE POLICY "Users can create buddy invites"
  ON accountability_buddies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buddy connections"
  ON accountability_buddies FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = buddy_id);

CREATE POLICY "Users can delete their own buddy connections"
  ON accountability_buddies FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = buddy_id);
