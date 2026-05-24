-- Shoes table for tracking running shoe mileage
CREATE TABLE IF NOT EXISTS shoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  nickname TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  initial_miles DECIMAL(10,2) DEFAULT 0,
  total_miles DECIMAL(10,2) DEFAULT 0,
  max_miles INTEGER DEFAULT 500,
  is_default BOOLEAN DEFAULT false,
  is_retired BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_shoes_user_id ON shoes(user_id);

-- Enable RLS
ALTER TABLE shoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own shoes"
  ON shoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shoes"
  ON shoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shoes"
  ON shoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shoes"
  ON shoes FOR DELETE
  USING (auth.uid() = user_id);

-- Add shoe_id column to runs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'runs' AND column_name = 'shoe_id'
  ) THEN
    ALTER TABLE runs ADD COLUMN shoe_id UUID REFERENCES shoes(id) ON DELETE SET NULL;
  END IF;
END $$;
