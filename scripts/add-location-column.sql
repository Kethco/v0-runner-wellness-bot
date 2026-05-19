-- Add location column to profiles table for weather feature
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN profiles.location IS 'User location for weather forecasts (city name)';
