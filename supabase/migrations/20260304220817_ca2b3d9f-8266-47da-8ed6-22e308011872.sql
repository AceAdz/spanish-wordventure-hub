
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  total_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Game scores
CREATE TABLE public.game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('wordle', 'verb_match')),
  score INTEGER NOT NULL DEFAULT 0,
  accuracy REAL,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scores viewable by everyone" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON public.game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_game_scores_user ON public.game_scores(user_id);
CREATE INDEX idx_game_scores_type_score ON public.game_scores(game_type, score DESC);
CREATE INDEX idx_game_scores_created ON public.game_scores(created_at DESC);

-- Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friendships
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendships sent to them" ON public.friendships FOR UPDATE USING (auth.uid() = friend_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Seed badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('First Steps', 'Play your first game', '🎮', 'games_played', 1),
  ('Getting Started', 'Play 5 games', '⭐', 'games_played', 5),
  ('Dedicated', 'Play 25 games', '🏅', 'games_played', 25),
  ('Veteran', 'Play 100 games', '🎖️', 'games_played', 100),
  ('Hot Streak', 'Get a 5 answer streak', '🔥', 'best_streak', 5),
  ('On Fire', 'Get a 10 answer streak', '💥', 'best_streak', 10),
  ('Unstoppable', 'Get a 20 answer streak', '⚡', 'best_streak', 20),
  ('Century', 'Score 100 total points', '💯', 'total_score', 100),
  ('High Roller', 'Score 500 total points', '🎰', 'total_score', 500),
  ('Legend', 'Score 1000 total points', '👑', 'total_score', 1000),
  ('Word Wizard', 'Win 10 Wordle games', '🧙', 'wordle_wins', 10),
  ('Verb Master', 'Complete 10 Verb Match quizzes', '🎯', 'verb_match_completed', 10);
