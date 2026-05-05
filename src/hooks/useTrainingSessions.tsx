import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useTrainingSessions(weekNumber?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['training-sessions', user?.id, weekNumber],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from('training_sessions').select('*').eq('user_id', user.id).order('day_of_week');
      if (weekNumber !== undefined) q = q.eq('week_number', weekNumber);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
