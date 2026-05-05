import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useRecentRuns } from '@/hooks/useRuns';
import { formatPace, formatDuration } from '@/lib/supabase-helpers';
import StatCard from '@/components/StatCard';
import { Activity, TrendingUp, Zap, Clock, Heart, Search, ChevronRight, MapPin, Trophy, Ruler, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistoryTab() {
  const { data: runs = [], isLoading } = useRecentRuns(60);
  const [search, setSearch] = useState('');
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return runs;
    return runs.filter(r =>
      format(new Date(r.created_at!), 'd MMM yyyy').toLowerCase().includes(search.toLowerCase()) ||
      String(r.distance_km).includes(search)
    );
  }, [runs, search]);

  const totalKm = runs.reduce((s, r) => s + Number(r.distance_km), 0);
  const totalTime = runs.reduce((s, r) => s + r.duration_seconds, 0);

  const selected = selectedRun ? runs.find(r => r.id === selectedRun) : null;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </div>
    );
  }

  if (selected) {
    const splitsData = (selected.splits as any[] || []).map((s: any) => ({
      km: `Km ${s.km}`,
      pace: Math.round(s.pace_seconds / 60 * 100) / 100,
    }));

    const allPaces = runs.filter(r => r.avg_pace_seconds).map(r => r.avg_pace_seconds!);
    const allDistances = runs.map(r => Number(r.distance_km));
    const allCalories = runs.filter(r => r.calories).map(r => r.calories!);
    const isBestPace = selected.avg_pace_seconds && selected.avg_pace_seconds <= Math.min(...allPaces);
    const isLongest = Number(selected.distance_km) >= Math.max(...allDistances);
    const isMostCalories = selected.calories && selected.calories >= Math.max(...allCalories);

    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <button onClick={() => setSelectedRun(null)} className="text-sm text-primary font-medium flex items-center gap-1">
          ← Back
        </button>
        <h2 className="text-xl font-bold text-foreground">
          {format(new Date(selected.created_at!), 'MMMM d, yyyy')}
        </h2>

        <div className="flex flex-wrap gap-2">
          {isBestPace && <span className="text-xs bg-accent px-2 py-1 rounded-full inline-flex items-center gap-1"><Trophy className="w-3 h-3 text-primary" /> Best Pace</span>}
          {isLongest && <span className="text-xs bg-accent px-2 py-1 rounded-full inline-flex items-center gap-1"><Ruler className="w-3 h-3 text-primary" /> Longest Distance</span>}
          {isMostCalories && <span className="text-xs bg-accent px-2 py-1 rounded-full inline-flex items-center gap-1"><Flame className="w-3 h-3 text-primary" /> Most Calories</span>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{Number(selected.distance_km).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">km</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatDuration(selected.duration_seconds)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{selected.avg_pace_seconds ? formatPace(selected.avg_pace_seconds) : '--'}</p>
            <p className="text-xs text-muted-foreground">Avg Pace</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{selected.calories || 0}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
        </div>

        {splitsData.length > 0 && (
          <>
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Pace per Km</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={splitsData}>
                  <XAxis dataKey="km" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pace" stroke="hsl(24, 95%, 53%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Splits</h3>
              <div className="space-y-1">
                {(selected.splits as any[] || []).map((s: any) => (
                  <div key={s.km} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Km {s.km}</span>
                    <span className="font-medium text-foreground">{formatPace(s.pace_seconds)}/km</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Activity History</h1>
        </div>
        <p className="text-sm text-muted-foreground">All your runs from the last 60 days</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label="Total Runs" value={String(runs.length)} color="text-stat-orange" bgColor="bg-accent" />
        <StatCard icon={Zap} label="Total Distance" value={`${totalKm.toFixed(1)} km`} color="text-stat-purple" bgColor="bg-tint-purple" />
        <StatCard icon={Clock} label="Total Time" value={formatDuration(totalTime)} color="text-stat-blue" bgColor="bg-tint-blue" />
        <StatCard icon={Heart} label="Avg HR" value="-- bpm" color="text-stat-pink" bgColor="bg-tint-pink" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search activity..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-foreground font-medium">No activities yet</p>
          <p className="text-sm text-muted-foreground">Your runs will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(run => (
            <button key={run.id} onClick={() => setSelectedRun(run.id)} className="w-full bg-card rounded-2xl border border-border p-3 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{format(new Date(run.created_at!), 'd MMM')}</p>
                  <p className="text-xs text-muted-foreground">{Number(run.distance_km).toFixed(1)} km · {formatDuration(run.duration_seconds)} · {run.calories || 0} kcal</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-foreground">{run.avg_pace_seconds ? formatPace(run.avg_pace_seconds) : '--'}/km</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
