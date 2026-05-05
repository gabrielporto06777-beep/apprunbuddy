import { supabase } from '@/integrations/supabase/client';

export const STRAVA_CALLBACK_URL = 'https://lvrkuzzuctngrnadwzox.supabase.co/functions/v1/strava-callback';

export async function getStravaAuthUrl() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('User must be logged in to connect Strava');

  const params = new URLSearchParams({
    client_id: '184780',
    response_type: 'code',
    redirect_uri: STRAVA_CALLBACK_URL,
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
    state: user.id,
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}