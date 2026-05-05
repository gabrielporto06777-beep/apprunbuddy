import { useMemo } from 'react';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { useRecentRuns } from '@/hooks/useRuns';
import { formatPace, formatDuration, PERFORMANCE_TIPS } from '@/lib/supabase-helpers';
import StatCard from '@/components/StatCard';
import StravaBanner from '@/components/StravaBanner';
import ThemeToggle from '@/components/ThemeToggle';
import { useStravaUser } from '@/hooks/useStravaUser';
import { TrendingUp, Gauge, CalendarCheck, Zap, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: runs = [], isLoading: runsLoading } = useRecentRuns(60);
  const { data: stravaUser, isLoading: stravaLoading } = useStravaUser();
  const loading = profileLoading || runsLoading;

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = format(today, 'EEEE, MMMM d');

  const stats = useMemo(() => {
    if (!runs.length) return { weeklyKm: 0, avgPace: 0, frequency: 0, readiness: 0, weekDoneKm: 0 };

    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekRuns = runs.filter(r => new Date(r.created_at!).getTime() >= weekStart.getTime());
    const weeklyKm = weekRuns.reduce((s, r) => s + Number(r.distance_km), 0);

    const totalKm = runs.reduce((s, r) => s + Number(r.distance_km), 0);
    const weeks60 = 60 / 7;
    const weeklyAvgKm = totalKm / weeks60;

    const pacesValid = runs.filter(r => r.avg_pace_seconds && r.avg_pace_seconds > 0);
    const avgPace = pacesValid.length ? Math.round(pacesValid.reduce((s, r) => s + r.avg_pace_seconds!, 0) / pacesValid.length) : 0;

    const frequency = Math.round((runs.length / weeks60) * 10) / 10;

    const sortedDates = [...new Set(runs.map(r => format(new Date(r.created_at!), 'yyyy-MM-dd')))].sort().reverse();
    let streak = 0;
    const d = new Date(); d.setHours(0,0,0,0);
    for (const ds of sortedDates) {
      if (ds === format(d, 'yyyy-MM-dd')) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    const goalDays = profile?.weekly_goal_days || 3;
    const readiness = Math.min(10, Math.round((streak / goalDays) * 10 * 10) / 10);

    return { weeklyKm: Math.round(weeklyAvgKm * 10) / 10, avgPace, frequency, readiness, weekDoneKm: Math.round(weeklyKm * 10) / 10 };
  }, [runs, profile]);

  const recentThree = runs.slice(0, 3);

  const tips = useMemo(() => {
    const day = today.getDate();
    return [PERFORMANCE_TIPS[day % 12], PERFORMANCE_TIPS[(day + 4) % 12], PERFORMANCE_TIPS[(day + 8) % 12]];
  }, []);

  const intensity = useMemo(() => {
    if (!runs.length) return { easy: 0, moderate: 0, intense: 0 };
    let l = 0, m = 0, i = 0;
    runs.forEach(r => {
      const pace = r.avg_pace_seconds || 360;
      if (pace > 360) l++; else if (pace >= 300) m++; else i++;
    });
    const t = runs.length;
    return { easy: Math.round(l/t*100), moderate: Math.round(m/t*100), intense: Math.round(i/t*100) };
  }, [runs]);

  const weekGoalKm = profile?.weekly_goal_km || 20;
  const weekProgress = Math.min(100, Math.round((stats.weekDoneKm / Number(weekGoalKm)) * 100));

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}, {profile?.name || 'Runner'}</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>
        <ThemeToggle />
      </div>

      {!stravaLoading && !stravaUser?.strava_id && <StravaBanner />}

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label="Weekly Volume" value={`${stats.weeklyKm} km`} subtitle="Avg over last 60 days" color="text-stat-orange" bgColor="bg-accent" />
        <StatCard icon={Gauge} label="Avg Pace" value={stats.avgPace ? formatPace(stats.avgPace) : '--:--'} subtitle="Per kilometer" color="text-stat-purple" bgColor="bg-tint-purple" />
        <StatCard icon={CalendarCheck} label="Frequency" value={`${stats.frequency}x`} subtitle="Workouts per week" color="text-stat-blue" bgColor="bg-tint-blue" />
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Readiness</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.readiness}/10</p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div className="bg-stat-green h-1.5 rounded-full transition-all" style={{ width: `${stats.readiness * 10}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-foreground">Weekly Goal</span>
          <span className="text-sm text-muted-foreground">{stats.weekDoneKm}/{weekGoalKm} km</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${weekProgress}%` }} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Activities</h2>
          <button onClick={() => onNavigate('history')} className="text-sm text-primary font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {recentThree.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs yet</p>
        ) : (
          <div className="space-y-2">
            {recentThree.map(run => (
              <div key={run.id} className="bg-card rounded-2xl border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{format(new Date(run.created_at!), 'd MMM')}</p>
                  <p className="text-xs text-muted-foreground">{Number(run.distance_km).toFixed(1)} km · {formatDuration(run.duration_seconds)}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{run.avg_pace_seconds ? formatPace(run.avg_pace_seconds) : '--'}/km</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Recommendations</h2>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-3 flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-accent-foreground">{i + 1}</span>
              </div>
              <p className="text-sm text-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Intensity Distribution</h2>
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          {[
            { label: 'Easy', pct: intensity.easy, color: 'bg-stat-green' },
            { label: 'Moderate', pct: intensity.moderate, color: 'bg-yellow-400' },
            { label: 'Intense', pct: intensity.intense, color: 'bg-stat-pink' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.pct}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
