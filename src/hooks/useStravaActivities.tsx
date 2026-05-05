import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
}

export interface StravaData {
  athlete: {
    name: string;
    avatar: string | null;
    strava_id: string | null;
  };
  activities: StravaActivity[];
  stats: {
    recent_run_totals?: { count: number; distance: number; moving_time: number; elevation_gain: number };
    ytd_run_totals?: { count: number; distance: number; moving_time: number; elevation_gain: number };
    all_run_totals?: { count: number; distance: number; moving_time: number; elevation_gain: number };
  } | null;
}

export function useStravaActivities() {
  const { user } = useAuth();

  return useQuery<StravaData | null>({
    queryKey: ['strava-activities', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const res = await supabase.functions.invoke('strava-sync', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      return res.data as StravaData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}
