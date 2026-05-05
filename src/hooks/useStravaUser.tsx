import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useStravaUser() {
  const qc = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('strava') === 'success') {
      qc.invalidateQueries({ queryKey: ['strava-user'] });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [qc]);

  return useQuery({
    queryKey: ['strava-user'],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}
