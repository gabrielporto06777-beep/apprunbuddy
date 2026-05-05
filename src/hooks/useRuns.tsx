import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useRuns(limit?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['runs', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from('runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useRecentRuns(days: number = 60) {
  const { user } = useAuth();
  const since = new Date();
  since.setDate(since.getDate() - days);
  return useQuery({
    queryKey: ['runs-recent', user?.id, days],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('runs').select('*').eq('user_id', user.id)
        .gte('created_at', since.toISOString()).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
