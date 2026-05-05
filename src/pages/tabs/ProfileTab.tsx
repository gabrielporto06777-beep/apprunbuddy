import { useMemo } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useRuns } from '@/hooks/useRuns';
import { useStravaUser } from '@/hooks/useStravaUser';
import { formatDuration } from '@/lib/supabase-helpers';
import { getStravaAuthUrl } from '@/lib/strava';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ThemeToggle from '@/components/ThemeToggle';
import { UserRound, TrendingUp, MapPin, Clock, Flame, Zap, LogOut, Link } from 'lucide-react';

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: runs = [], isLoading: runsLoading } = useRuns();
  const { data: stravaUser } = useStravaUser();
  const updateProfile = useUpdateProfile();
  const isStravaConnected = !!stravaUser?.strava_id;

  const loading = profileLoading || runsLoading;

  const stats = useMemo(() => {
    const totalKm = runs.reduce((s, r) => s + Number(r.distance_km), 0);
    const totalTime = runs.reduce((s, r) => s + r.duration_seconds, 0);
    const totalCal = runs.reduce((s, r) => s + (r.calories || 0), 0);

    const dates = [...new Set(runs.map(r => format(new Date(r.created_at!), 'yyyy-MM-dd')))].sort().reverse();
    let streak = 0;
    const d = new Date(); d.setHours(0,0,0,0);
    for (const dateStr of dates) {
      if (dateStr === format(d, 'yyyy-MM-dd')) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    return { totalRuns: runs.length, totalKm: Math.round(totalKm * 10) / 10, totalTime, totalCal, streak };
  }, [runs]);

  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '';

  const handleStravaConnect = async () => {
    try {
      const stravaAuthUrl = await getStravaAuthUrl();
      window.open(stravaAuthUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to start Strava OAuth', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
          {(profile?.name || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{profile?.name || 'Runner'}</p>
          <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.totalRuns}</p>
          <p className="text-xs text-muted-foreground">Runs</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.totalKm} km</p>
          <p className="text-xs text-muted-foreground">Distance</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{formatDuration(stats.totalTime)}</p>
          <p className="text-xs text-muted-foreground">Total Time</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{stats.totalCal}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 shadow-sm">
        <Zap className="w-6 h-6 text-primary" />
        <div>
          <p className="text-lg font-bold text-foreground">{stats.streak} consecutive days</p>
          <p className="text-xs text-muted-foreground">Running streak</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Goals</h3>
        <div>
          <label className="text-sm text-foreground">Days per week: {profile?.weekly_goal_days || 3}</label>
          <Slider
            min={1} max={7} step={1}
            value={[profile?.weekly_goal_days || 3]}
            onValueChange={v => updateProfile.mutate({ weekly_goal_days: v[0] })}
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-sm text-foreground">Weekly goal: {profile?.weekly_goal_km || 20} km</label>
          <Slider
            min={5} max={100} step={5}
            value={[Number(profile?.weekly_goal_km) || 20]}
            onValueChange={v => updateProfile.mutate({ weekly_goal_km: v[0] })}
            className="mt-2"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Settings</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Audio Coach</span>
          <Switch
            checked={profile?.audio_coach_enabled ?? true}
            onCheckedChange={v => updateProfile.mutate({ audio_coach_enabled: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Notifications</span>
          <Switch checked={false} disabled />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isStravaConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-foreground font-medium">Strava</span>
          </div>
          {isStravaConnected ? (
            <span className="text-xs text-muted-foreground">Connected</span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { void handleStravaConnect(); }}
              className="flex items-center gap-1.5"
            >
              <Link className="w-3.5 h-3.5" /> Connect
            </Button>
          )}
        </div>
        <Button variant="outline" onClick={signOut} className="w-full flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
