import { useState } from 'react';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import WorkoutBadge from '@/components/WorkoutBadge';
import WorkoutDetailModal from '@/components/WorkoutDetailModal';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Zap, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function TrainingTab() {
  const [week, setWeek] = useState(1);
  const { data: sessions = [], isLoading } = useTrainingSessions(week);
  const qc = useQueryClient();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalSessions = sessions.filter(s => s.session_type !== 'Rest').length;
  const completed = sessions.filter(s => s.completed).length;
  const pending = totalSessions - completed;
  const totalKm = sessions.reduce((s, se) => s + (Number(se.distance_km) || 0), 0);

  const toggleComplete = async (sessionId: string, currentlyCompleted: boolean) => {
    setTogglingId(sessionId);
    const { error } = await supabase
      .from('training_sessions')
      .update({ completed: !currentlyCompleted })
      .eq('id', sessionId);
    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      toast.success(!currentlyCompleted ? 'Treino concluído! 🎉' : 'Marcado como pendente');
      qc.invalidateQueries({ queryKey: ['training-sessions'] });
      // Update local selected session state
      if (selectedSession?.id === sessionId) {
        setSelectedSession((prev: any) => prev ? { ...prev, completed: !currentlyCompleted } : null);
      }
    }
    setTogglingId(null);
  };

  const handleCardTap = (session: any) => {
    setSelectedSession(session);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2 overflow-x-auto">{[1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="h-40 w-28 flex-shrink-0 rounded-2xl" />)}</div>
      </div>
    );
  }

  const sortedSessions = [...sessions].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Calendário de Treinos</h1>
        </div>
        <p className="text-sm text-muted-foreground">Toque em um treino para ver detalhes</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setWeek(w => Math.max(1, w - 1))} disabled={week === 1} className="p-2 rounded-lg bg-muted disabled:opacity-30">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <span className="text-sm font-semibold px-4 py-1.5 border border-primary rounded-full text-foreground">
          Semana {week} de 8
        </span>
        <button onClick={() => setWeek(w => Math.min(8, w + 1))} disabled={week === 8} className="p-2 rounded-lg bg-muted disabled:opacity-30">
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {sortedSessions.map(session => {
          const isRest = session.session_type === 'Rest';
          return (
            <button
              key={session.id}
              onClick={() => handleCardTap(session)}
              className={cn(
                'flex-shrink-0 w-28 rounded-2xl border p-3 space-y-2 text-left transition-all active:scale-[0.97]',
                isRest
                  ? 'bg-card border-border/50'
                  : session.completed
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-card border-border shadow-sm hover:border-primary/50'
              )}
            >
              <p className="text-xs text-muted-foreground font-medium">{dayNames[session.day_of_week]}</p>
              <WorkoutBadge type={session.session_type} />
              {!isRest && (
                <>
                  <p className="text-xs font-medium text-foreground truncate">{session.title}</p>
                  <div className="space-y-1 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{Number(session.distance_km).toFixed(0)} km</div>
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.target_pace}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {session.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-[10px] text-muted-foreground">{session.completed ? 'Feito' : 'Pendente'}</span>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Resumo da Semana {week}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalKm} km</p>
            <p className="text-xs text-muted-foreground">Volume Total</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-stat-green">{completed}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>
      </div>

      <WorkoutDetailModal
        session={selectedSession}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onToggleComplete={toggleComplete}
        isToggling={togglingId === selectedSession?.id}
      />
    </div>
  );
}
