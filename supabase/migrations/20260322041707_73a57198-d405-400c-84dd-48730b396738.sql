
-- Create users table for Run Baddy
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  strava_id text UNIQUE,
  strava_avatar text,
  full_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own row" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Create strava_tokens table
CREATE TABLE public.strava_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens" ON public.strava_tokens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage tokens" ON public.strava_tokens
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
