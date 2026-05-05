-- Drop the old Portuguese-only check constraint
ALTER TABLE training_sessions DROP CONSTRAINT training_sessions_session_type_check;

-- Add new constraint that accepts both English and Portuguese values (backward compatible)
ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_session_type_check 
  CHECK (session_type = ANY (ARRAY['Easy', 'Intervals', 'Tempo Run', 'Long Run', 'Rest', 'Leve', 'Intervalado', 'Longão', 'Descanso']));

-- Update existing Portuguese session types to English
UPDATE training_sessions SET session_type = 'Easy' WHERE session_type = 'Leve';
UPDATE training_sessions SET session_type = 'Intervals' WHERE session_type = 'Intervalado';
UPDATE training_sessions SET session_type = 'Long Run' WHERE session_type = 'Longão';
UPDATE training_sessions SET session_type = 'Rest' WHERE session_type = 'Descanso';

-- Also update Portuguese titles
UPDATE training_sessions SET title = 'Easy Run' WHERE title = 'Corrida Leve';
UPDATE training_sessions SET title = 'Intervals 5x1000m' WHERE title LIKE 'Intervalado%';
UPDATE training_sessions SET title = 'Long Run' WHERE title = 'Corrida Longa';
UPDATE training_sessions SET title = 'Tempo Run' WHERE title LIKE 'Tempo%' AND session_type = 'Tempo Run';
UPDATE training_sessions SET title = 'Rest' WHERE title = 'Descanso';