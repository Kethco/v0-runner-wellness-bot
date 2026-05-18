-- Personal Records table to track PR history
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distance TEXT NOT NULL, -- '1_mile', '5k', '10k', 'half_marathon', 'marathon'
  distance_miles NUMERIC(5,2) NOT NULL,
  time_seconds INTEGER NOT NULL, -- Total time in seconds for easy comparison
  time_display TEXT NOT NULL, -- Formatted time like "25:30"
  pace TEXT, -- e.g., "8:15/mi"
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  achieved_at DATE NOT NULL,
  is_current_best BOOLEAN DEFAULT true,
  previous_best_seconds INTEGER, -- Previous PR time (to show improvement)
  improvement_seconds INTEGER, -- How much faster than previous PR
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_distance_time UNIQUE (user_id, distance, time_seconds)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_personal_records_user_distance ON personal_records(user_id, distance);
CREATE INDEX IF NOT EXISTS idx_personal_records_current_best ON personal_records(user_id, is_current_best) WHERE is_current_best = true;

-- RLS Policies
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Users can only see their own records
CREATE POLICY "Users can view own personal records" ON personal_records
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own personal records" ON personal_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own personal records" ON personal_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update is_current_best when new PR is added
CREATE OR REPLACE FUNCTION update_current_best_pr()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all other records for this distance as not current best
  UPDATE personal_records
  SET is_current_best = false, updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND distance = NEW.distance
    AND id != NEW.id
    AND is_current_best = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update current best
DROP TRIGGER IF EXISTS tr_update_current_best_pr ON personal_records;
CREATE TRIGGER tr_update_current_best_pr
  AFTER INSERT ON personal_records
  FOR EACH ROW
  WHEN (NEW.is_current_best = true)
  EXECUTE FUNCTION update_current_best_pr();
