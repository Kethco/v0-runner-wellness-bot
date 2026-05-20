-- Resilience Journal Table
-- Stores self-compassion entries when runners have tough days

CREATE TABLE IF NOT EXISTS resilience_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  trigger_type TEXT, -- 'bad_run', 'low_energy', 'high_soreness', 'manual'
  
  -- What happened
  situation TEXT,
  initial_feelings TEXT,
  
  -- Self-compassion prompts
  friend_advice TEXT, -- "What would you say to a friend?"
  reframe TEXT, -- Cognitive reframing
  
  -- Self-kindness action taken
  kindness_action TEXT,
  kindness_completed BOOLEAN DEFAULT FALSE,
  
  -- Mood shift tracking
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5),
  
  -- Related run (optional)
  run_id UUID REFERENCES runs(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_resilience_journal_user_id ON resilience_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_resilience_journal_date ON resilience_journal(date DESC);

-- Enable RLS
ALTER TABLE resilience_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "resilience_journal_select_own" ON resilience_journal;
DROP POLICY IF EXISTS "resilience_journal_insert_own" ON resilience_journal;
DROP POLICY IF EXISTS "resilience_journal_update_own" ON resilience_journal;
DROP POLICY IF EXISTS "resilience_journal_delete_own" ON resilience_journal;

CREATE POLICY "resilience_journal_select_own" ON resilience_journal
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "resilience_journal_insert_own" ON resilience_journal
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resilience_journal_update_own" ON resilience_journal
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "resilience_journal_delete_own" ON resilience_journal
  FOR DELETE USING (auth.uid() = user_id);
