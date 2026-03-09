
-- Add streak columns directly to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date;
