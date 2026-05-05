import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, CheckCircle2, Circle, Loader2, FileText } from 'lucide-react';
import WorkoutBadge from '@/components/WorkoutBadge';
import { cn } from '@/lib/utils';

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface Session {
  id: string;
  day_of_week: number;
  session_type: string;
  title: string;
  distance_km: number | null;
  target_pace: string | null;
  completed: boolean | null;
  description: string | null;
  week_number: number;
}

interface Props {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  isToggling: boolean;
}

export default function WorkoutDetailModal({ session, open, onOpenChange, onToggleComplete, isToggling }: Props) {
  if (!session) return null;

  const isRest = session.session_type === 'Rest';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border text-foreground rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <WorkoutBadge type={session.session_type} />
            <DialogTitle className="text-lg font-bold text-foreground">
              {session.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {dayNames[session.day_of_week]} — Semana {session.week_number}
          </DialogDescription>
        </DialogHeader>

        {!isRest && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Distância</p>
                  <p className="text-sm font-semibold text-foreground">
                    {session.distance_km != null ? `${Number(session.distance_km).toFixed(1)} km` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Pace Alvo</p>
                  <p className="text-sm font-semibold text-foreground">
                    {session.target_pace || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
              {session.completed ? (
                <CheckCircle2 className="w-5 h-5 text-stat-green" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={cn(
                "text-sm font-medium",
                session.completed ? "text-stat-green" : "text-muted-foreground"
              )}>
                {session.completed ? 'Concluído' : 'Pendente'}
              </span>
            </div>

            {session.description && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Detalhes do Treino</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {session.description}
                </p>
              </div>
            )}

            <Button
              className="w-full rounded-xl"
              variant={session.completed ? "outline" : "default"}
              disabled={isToggling}
              onClick={() => onToggleComplete(session.id, !!session.completed)}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : session.completed ? (
                <Circle className="w-4 h-4 mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {session.completed ? 'Desmarcar como concluído' : 'Marcar como concluído'}
            </Button>
          </div>
        )}

        {isRest && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">Dia de descanso. Recupere-se bem!</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
