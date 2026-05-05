
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS running_frequency text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avg_run_distance text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avg_pace text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS session_duration_min integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS injuries text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_intensity text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS training_location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_workouts text;
