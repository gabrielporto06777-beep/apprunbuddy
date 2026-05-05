import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStravaUser } from '@/hooks/useStravaUser';
import { useStravaActivities, StravaActivity } from '@/hooks/useStravaActivities';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useProfile } from '@/hooks/useProfile';
import StravaBanner from '@/components/StravaBanner';
import ThemeToggle from '@/components/ThemeToggle';
import { getSessionDisplayName } from '@/lib/supabase-helpers';
import WorkoutBadge from '@/components/WorkoutBadge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Activity, Clock, Mountain, Gauge, Calendar,
  MapPin, Heart, ChevronRight, ChevronLeft, Zap, Footprints
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function formatMovingTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}min`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPaceFromSpeed(avgSpeed: number): string {
  if (!avgSpeed || avgSpeed <= 0) return '--:--';
  const paceSeconds = 1000 / avgSpeed;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDatePtBR(dateStr: string): string {
  const d = new Date(dateStr);
  return format(d, "EEEE, d MMM", { locale: ptBR });
}

function getActivityIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'run': return Footprints;
    case 'ride': return Activity;
    default: return Activity;
  }
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Dashboard() {
  const { data: stravaUser, isLoading: stravaUserLoading, refetch: refetchStrava } = useStravaUser();
  const { data: stravaData, isLoading: activitiesLoading } = useStravaActivities();
  const { data: profile } = useProfile();
  const { data: sessions = [], isLoading: sessionsLoading } = useTrainingSessions();
  const isReturningFromStrava = new URLSearchParams(window.location.search).get('strava') === 'success';

  useEffect(() => {
    if (isReturningFromStrava) {
      void refetchStrava();
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [isReturningFromStrava, refetchStrava]);

  const showBanner = !stravaUserLoading && !isReturningFromStrava && !stravaUser?.strava_id;
  const isConnected = !!stravaUser?.strava_id;

  // Current week sessions (week 1 by default, ideally calculate based on plan start)
  const currentWeekSessions = useMemo(() => {
    const week1 = sessions.filter(s => s.week_number === 1);
    return [...week1].sort((a, b) => a.day_of_week - b.day_of_week);
  }, [sessions]);

  // Monthly stats from Strava activities
  const monthlyStats = useMemo(() => {
    if (!stravaData?.activities) return { totalActivities: 0, totalKm: 0, totalElevation: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthActivities = stravaData.activities.filter(
      a => new Date(a.start_date).getTime() >= monthStart.getTime()
    );
    return {
      totalActivities: monthActivities.length,
      totalKm: Math.round(monthActivities.reduce((s, a) => s + (a.distance || 0), 0) / 100) / 10,
      totalElevation: Math.round(monthActivities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0)),
    };
  }, [stravaData]);

  // Quick stats
  const quickStats = useMemo(() => {
    if (!stravaData?.activities?.length) return { avgPace7d: '--:--', weeklyKm: 0, elevationMonth: 0 };
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7 = stravaData.activities.filter(
      a => a.type === 'Run' && new Date(a.start_date).getTime() >= weekAgo.getTime()
    );
    const avgSpeed = last7.length
      ? last7.reduce((s, a) => s + a.average_speed, 0) / last7.length
      : 0;

    const weeklyKm = Math.round(last7.reduce((s, a) => s + (a.distance || 0), 0) / 100) / 10;

    return {
      avgPace7d: avgSpeed > 0 ? formatPaceFromSpeed(avgSpeed) : '--:--',
      weeklyKm,
      elevationMonth: monthlyStats.totalElevation,
    };
  }, [stravaData, monthlyStats]);

  const recentActivities = stravaData?.activities?.slice(0, 5) ?? [];
  const athleteName = stravaData?.athlete?.name || stravaUser?.full_name || profile?.name || 'Atleta';
  const athleteAvatar = stravaData?.athlete?.avatar || stravaUser?.strava_avatar;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // Auto-generate training plan if connected but no sessions
  useEffect(() => {
    if (isConnected && !sessionsLoading && sessions.length === 0) {
      supabase.functions.invoke('generate-plan').catch(console.error);
    }
  }, [isConnected, sessionsLoading, sessions.length]);

  const weekGoalKm = Number(profile?.weekly_goal_km) || 20;
  const weekProgress = weekGoalKm > 0 ? Math.min(100, Math.round((quickStats.weeklyKm / weekGoalKm) * 100)) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {athleteAvatar ? (
              <img src={athleteAvatar} alt={athleteName} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{athleteName.charAt(0)}</span>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{greeting}</p>
              <h1 className="text-xl font-bold text-foreground">{athleteName}</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* STRAVA BANNER */}
        {showBanner && <StravaBanner />}

        {/* MONTHLY OVERVIEW */}
        {isConnected && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl border border-border p-3 text-center shadow-sm">
              <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{monthlyStats.totalActivities}</p>
              <p className="text-[10px] text-muted-foreground">Atividades este mês</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-3 text-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{monthlyStats.totalKm} km</p>
              <p className="text-[10px] text-muted-foreground">Distância este mês</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-3 text-center shadow-sm">
              <Mountain className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{monthlyStats.totalElevation}m</p>
              <p className="text-[10px] text-muted-foreground">Elevação este mês</p>
            </div>
          </div>
        )}

        {/* QUICK STATS */}
        {isConnected && (
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Estatísticas rápidas
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Gauge className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{quickStats.avgPace7d}/km</p>
                <p className="text-[10px] text-muted-foreground">Pace médio (7d)</p>
              </div>
              <div className="text-center">
                <Mountain className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{quickStats.elevationMonth}m</p>
                <p className="text-[10px] text-muted-foreground">Elevação mensal</p>
              </div>
              <div className="text-center">
                <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{quickStats.weeklyKm}/{weekGoalKm} km</p>
                <p className="text-[10px] text-muted-foreground">Meta semanal</p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${weekProgress}%` }} />
            </div>
          </div>
        )}

        {/* RECENT ACTIVITIES */}
        {isConnected && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Atividades Recentes</h2>
            {activitiesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade encontrada</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{activity.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {formatDatePtBR(activity.start_date_local)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {activity.type === 'Run' ? 'Corrida' : activity.type === 'Ride' ? 'Pedal' : activity.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="text-foreground font-medium">
                            {(activity.distance / 1000).toFixed(2)} km
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          <span className="text-foreground font-medium">
                            {formatPaceFromSpeed(activity.average_speed)}/km
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-foreground font-medium">
                            {formatMovingTime(activity.moving_time)}
                          </span>
                        </div>
                        {activity.average_heartrate && (
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span className="text-foreground font-medium">
                              {Math.round(activity.average_heartrate)} bpm
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TRAINING PLAN */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Plano de Treino</h2>
          </div>
          {sessionsLoading ? (
            <div className="flex gap-2 overflow-x-auto">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-36 w-28 flex-shrink-0 rounded-2xl" />)}
            </div>
          ) : currentWeekSessions.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-sm">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? 'Gerando seu plano de treino...'
                  : 'Conecte seu Strava para gerar um plano personalizado'}
              </p>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {currentWeekSessions.map(session => (
                <div
                  key={session.id}
                  className={`flex-shrink-0 w-28 bg-card rounded-2xl border p-3 space-y-2 ${
                    session.session_type !== 'Rest' ? 'border-border shadow-sm' : 'border-border/50'
                  }`}
                >
                  <p className="text-xs text-muted-foreground font-medium">{dayNames[session.day_of_week]}</p>
                  <WorkoutBadge type={session.session_type} />
                  {session.session_type !== 'Rest' && (
                    <>
                      <p className="text-xs font-medium text-foreground truncate">
                        {getSessionDisplayName(session.session_type)}
                      </p>
                      <div className="space-y-1 text-[10px] text-muted-foreground">
                        {session.distance_km && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{Number(session.distance_km).toFixed(0)} km
                          </div>
                        )}
                        {session.target_pace && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{session.target_pace}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EMPTY STATE FOR NON-CONNECTED */}
        {!isConnected && !showBanner && (
          <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-sm">
            <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Conecte seu Strava para ver suas atividades e estatísticas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
