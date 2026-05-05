
-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  weekly_goal_days INT DEFAULT 3,
  weekly_goal_km NUMERIC DEFAULT 20,
  audio_coach_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create runs table
CREATE TABLE public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  distance_km NUMERIC NOT NULL,
  duration_seconds INT NOT NULL,
  avg_pace_seconds INT,
  calories INT,
  route_geojson JSONB,
  splits JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON public.runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own runs" ON public.runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runs" ON public.runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own runs" ON public.runs FOR DELETE USING (auth.uid() = user_id);

-- Create training_plans table
CREATE TABLE public.training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT,
  total_weeks INT NOT NULL
);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read training plans" ON public.training_plans FOR SELECT TO authenticated USING (true);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  session_type TEXT NOT NULL CHECK (session_type IN ('Leve', 'Intervalado', 'Tempo Run', 'Longão', 'Descanso')),
  title TEXT NOT NULL,
  distance_km NUMERIC,
  target_pace TEXT,
  completed BOOLEAN DEFAULT false,
  completed_run_id UUID REFERENCES public.runs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.training_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.training_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.training_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed training plan
INSERT INTO public.training_plans (id, name, level, total_weeks)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Plano Performance', 'intermediate', 8);
