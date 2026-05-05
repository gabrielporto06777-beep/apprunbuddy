import { supabase } from "@/integrations/supabase/client";

const PLAN_ID = 'a0000000-0000-0000-0000-000000000001';

export async function assignTrainingPlan(userId: string) {
  const sessions: Array<{
    plan_id: string;
    user_id: string;
    week_number: number;
    day_of_week: number;
    session_type: string;
    title: string;
    distance_km: number | null;
    target_pace: string | null;
  }> = [];

  for (let week = 1; week <= 8; week++) {
    sessions.push({
      plan_id: PLAN_ID, user_id: userId, week_number: week, day_of_week: 1,
      session_type: 'Easy Run', title: 'Easy Run', distance_km: 6, target_pace: '6:00/km',
    });
    sessions.push({
      plan_id: PLAN_ID, user_id: userId, week_number: week, day_of_week: 3,
      session_type: 'Interval Session', title: 'Interval Session', distance_km: 8, target_pace: '4:30/km',
    });
    sessions.push({
      plan_id: PLAN_ID, user_id: userId, week_number: week, day_of_week: 5,
      session_type: 'Tempo Run', title: 'Tempo Run', distance_km: 10, target_pace: '5:15/km',
    });
    sessions.push({
      plan_id: PLAN_ID, user_id: userId, week_number: week, day_of_week: 6,
      session_type: 'Long Run', title: 'Long Run', distance_km: 17 + (week - 1), target_pace: '6:15/km',
    });
    [0, 2, 4].forEach(day => {
      sessions.push({
        plan_id: PLAN_ID, user_id: userId, week_number: week, day_of_week: day,
        session_type: 'Rest', title: 'Rest', distance_km: null, target_pace: null,
      });
    });
  }

  const { error } = await supabase.from('training_sessions').insert(sessions);
  if (error) console.error('Error assigning training plan:', error);
}

export function formatPace(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getSessionBadgeClasses(type: string) {
  switch (type) {
    case 'Easy Run':
    case 'Easy':
    case 'Leve':
    case 'Recovery Run':
      return 'bg-badge-leve-bg text-badge-leve-fg';
    case 'Interval Session':
    case 'Intervals':
    case 'Intervalado':
      return 'bg-badge-intervalado-bg text-badge-intervalado-fg';
    case 'Tempo Run':
      return 'bg-badge-tempo-bg text-badge-tempo-fg';
    case 'Long Run':
    case 'Longão':
      return 'bg-badge-longao-bg text-badge-longao-fg';
    default:
      return 'text-badge-descanso-fg';
  }
}

export function getSessionDisplayName(type: string): string {
  switch (type) {
    case 'Leve':
    case 'Easy':
    case 'Easy Run':
      return 'Easy Run';
    case 'Intervalado':
    case 'Intervals':
    case 'Interval Session':
      return 'Interval Session';
    case 'Tempo Run':
      return 'Tempo Run';
    case 'Longão':
    case 'Long Run':
      return 'Long Run';
    case 'Recuperação':
    case 'Recovery Run':
      return 'Recovery Run';
    case 'Descanso':
    case 'Rest':
      return 'Rest';
    default:
      return type;
  }
}

export const PERFORMANCE_TIPS = [
  "Increase your weekly mileage by no more than 10% to avoid injuries.",
  "Stay well hydrated before, during, and after your run.",
  "Include strength training exercises 2x per week.",
  "Sleep at least 7-8 hours per night for better recovery.",
  "Do dynamic warm-ups before each workout.",
  "Vary the running surface: pavement, trails, grass.",
  "Use running shoes suited to your gait type.",
  "Practice rhythmic breathing: inhale for 3 steps, exhale for 2.",
  "Eat carbs 2 hours before long runs.",
  "Only do static stretching after your run.",
  "Train at different times to help your body adapt.",
  "Monitor your heart rate to train in the right zones.",
];
