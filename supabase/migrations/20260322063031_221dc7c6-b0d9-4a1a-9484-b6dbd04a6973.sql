ALTER TABLE public.training_sessions DROP CONSTRAINT IF EXISTS training_sessions_session_type_check;
ALTER TABLE public.training_sessions
ADD CONSTRAINT training_sessions_session_type_check
CHECK (
  session_type = ANY (
    ARRAY[
      'Easy Run'::text,
      'Interval Session'::text,
      'Tempo Run'::text,
      'Long Run'::text,
      'Recovery Run'::text,
      'Rest'::text,
      'Easy'::text,
      'Intervals'::text,
      'Leve'::text,
      'Intervalado'::text,
      'Longão'::text,
      'Descanso'::text
    ]
  )
);

UPDATE public.training_sessions SET session_type = 'Easy Run' WHERE session_type IN ('Easy', 'Leve');
UPDATE public.training_sessions SET session_type = 'Interval Session' WHERE session_type IN ('Intervals', 'Intervalado');
UPDATE public.training_sessions SET session_type = 'Long Run' WHERE session_type = 'Longão';
UPDATE public.training_sessions SET session_type = 'Rest' WHERE session_type = 'Descanso';
UPDATE public.training_sessions SET title = 'Easy Run' WHERE title IN ('Corrida Leve', 'Easy');
UPDATE public.training_sessions SET title = 'Interval Session' WHERE title ILIKE 'Intervalado%' OR title = 'Intervals 5x1000m' OR title = 'Intervals';
UPDATE public.training_sessions SET title = 'Long Run' WHERE title IN ('Corrida Longa', 'Longão');
UPDATE public.training_sessions SET title = 'Recovery Run' WHERE title IN ('Recuperação');
UPDATE public.training_sessions SET title = 'Rest' WHERE title IN ('Descanso');
UPDATE public.training_plans SET name = 'Performance Plan' WHERE name = 'Plano Performance';