import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getStravaAuthUrl } from '@/lib/strava';
import {
  User, Target, Activity, Timer, CalendarDays, Clock,
  HeartPulse, Scale, Zap, MapPin, ListChecks,
  ChevronLeft, Loader2, Check,
} from 'lucide-react';

const TOTAL_STEPS = 12;

const goals = [
  { value: 'weight_loss', label: 'Emagrecer' },
  { value: 'fitness', label: 'Melhorar condicionamento' },
  { value: '5k', label: 'Correr 5 km' },
  { value: '10k', label: 'Correr 10 km' },
  { value: 'half', label: 'Meia maratona (21 km)' },
  { value: 'full', label: 'Maratona (42 km)' },
  { value: 'pace', label: 'Melhorar tempo (pace)' },
  { value: 'habit', label: 'Criar hábito' },
  { value: 'mental_health', label: 'Saúde mental' },
];

const frequencies = [
  { value: 'none', label: 'Não corro' },
  { value: 'sometimes', label: 'Corro às vezes' },
  { value: '1-2x', label: 'Corro 1–2x por semana' },
  { value: '3-4x', label: 'Corro 3–4x por semana' },
  { value: '5+', label: 'Corro 5+ vezes por semana' },
];

const distances = [
  { value: '2-3km', label: '2–3 km' },
  { value: '3-5km', label: '3–5 km' },
  { value: '5-8km', label: '5–8 km' },
  { value: '8-12km', label: '8–12 km' },
  { value: '12+km', label: '12+ km' },
];

const paces = [
  { value: '7+', label: '7:00+' },
  { value: '6-7', label: '6:00 – 7:00' },
  { value: '5-6', label: '5:00 – 6:00' },
  { value: '4-5', label: '4:00 – 5:00' },
  { value: '<4', label: '< 4:00' },
  { value: 'unknown', label: 'Não sei' },
];

const daysOptions = [
  { value: 2, label: '2 dias' },
  { value: 3, label: '3 dias' },
  { value: 4, label: '4 dias' },
  { value: 5, label: '5 dias' },
  { value: 6, label: '6 dias' },
];

const sessionDurations = [
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min+' },
];

const injuryOptions = [
  { value: 'none', label: 'Não tenho lesão' },
  { value: 'knee', label: 'Joelho' },
  { value: 'ankle', label: 'Tornozelo' },
  { value: 'shin', label: 'Canela' },
  { value: 'hip', label: 'Quadril' },
  { value: 'back', label: 'Costas' },
];

const intensityOptions = [
  { value: 'light', label: 'Leve e progressivo' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'intense', label: 'Intenso' },
  { value: 'challenging', label: 'Desafiador' },
];

const locationOptions = [
  { value: 'treadmill', label: 'Esteira' },
  { value: 'street', label: 'Rua' },
  { value: 'park', label: 'Parque' },
  { value: 'gym', label: 'Academia' },
  { value: 'trail', label: 'Trilha' },
];

const workoutTypes = [
  { value: 'walking', label: 'Caminhada' },
  { value: 'running', label: 'Corrida' },
  { value: 'intervals', label: 'Tiros (intervalado)' },
  { value: 'hills', label: 'Subida' },
  { value: 'long_run', label: 'Longão' },
  { value: 'strength', label: 'Treino de força' },
  { value: 'stretching', label: 'Alongamento' },
  { value: 'all', label: 'Todos' },
];

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('');
  const [avgDistance, setAvgDistance] = useState('');
  const [avgPace, setAvgPace] = useState('');
  const [goalDays, setGoalDays] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [selectedInjuries, setSelectedInjuries] = useState<string[]>([]);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [intensity, setIntensity] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);

  const toggleMulti = (
    value: string,
    selected: string[],
    setter: (v: string[]) => void,
    exclusiveValue?: string
  ) => {
    if (exclusiveValue && value === exclusiveValue) {
      setter([exclusiveValue]);
      return;
    }
    const filtered = exclusiveValue ? selected.filter(x => x !== exclusiveValue) : selected;
    setter(filtered.includes(value) ? filtered.filter(x => x !== value) : [...filtered, value]);
  };

  const getProfileData = () => ({
    name,
    race_goal: selectedGoals.join(','),
    running_frequency: frequency,
    avg_run_distance: avgDistance || null,
    avg_pace: avgPace,
    weekly_goal_days: goalDays,
    session_duration_min: sessionDuration,
    injuries: selectedInjuries.join(','),
    weight_kg: weight ? parseFloat(weight) : null,
    height_cm: height ? parseFloat(height) : null,
    training_intensity: intensity,
    training_location: selectedLocations.join(','),
    preferred_workouts: selectedWorkouts.join(','),
    fitness_level: frequency === 'none' || frequency === 'sometimes' ? 'beginner'
      : frequency === '1-2x' || frequency === '3-4x' ? 'intermediate' : 'advanced',
  });

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update(getProfileData()).eq('id', user.id);
      if (error) throw error;
      try {
        await supabase.functions.invoke('generate-plan', { body: {} });
      } catch (e) {
        console.error('Plan generation failed (non-blocking):', e);
      }
      onComplete();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStravaConnect = async () => {
    if (!user) return;
    await supabase.from('profiles').update(getProfileData()).eq('id', user.id);
    try {
      const stravaAuthUrl = await getStravaAuthUrl();
      window.open(stravaAuthUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to start Strava OAuth', error);
    }
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const StepHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
    <div className="text-center space-y-2">
      <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  );

  const BackBtn = () => (
    <button onClick={back} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <ChevronLeft className="w-4 h-4" /> Voltar
    </button>
  );

  const NextBtn = ({ disabled }: { disabled: boolean }) => (
    <Button onClick={next} disabled={disabled} className="w-full h-12 text-base font-bold rounded-xl">
      Próximo
    </Button>
  );

  const OptionCard = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.97]',
        selected ? 'border-primary bg-card' : 'border-border bg-card hover:border-muted-foreground/40'
      )}
    >
      <p className="font-semibold text-foreground">{label}</p>
    </button>
  );

  const MultiOptionCard = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.97] flex items-center justify-between',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/40'
      )}
    >
      <p className="font-semibold text-foreground">{label}</p>
      {selected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
    </button>
  );

  const CompactOptionCard = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'p-3 rounded-xl border-2 text-center transition-all active:scale-[0.97]',
        selected ? 'border-primary bg-card' : 'border-border bg-card hover:border-muted-foreground/40'
      )}
    >
      <p className="font-semibold text-foreground text-sm">{label}</p>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">
            Passo {step} de {TOTAL_STEPS}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                i + 1 <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-6 py-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">

          {/* STEP 1 — Nome */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <StepHeader icon={User} title="Qual é o seu nome?" subtitle="Para personalizar a sua experiência." />
              <Input placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} className="h-12 text-base rounded-xl" />
              <NextBtn disabled={!name.trim()} />
            </div>
          )}

          {/* STEP 2 — Objetivo (MULTI-SELECT) */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={Target} title="Qual é o seu objetivo?" subtitle="Selecione um ou mais objetivos." />
              <div className="space-y-2">
                {goals.map(g => (
                  <MultiOptionCard key={g.value} label={g.label} selected={selectedGoals.includes(g.value)} onClick={() => toggleMulti(g.value, selectedGoals, setSelectedGoals)} />
                ))}
              </div>
              <NextBtn disabled={selectedGoals.length === 0} />
            </div>
          )}

          {/* STEP 3 — Frequência */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={Activity} title="Você corre atualmente?" subtitle="Nos ajuda a calibrar o seu plano." />
              <div className="space-y-2">
                {frequencies.map(f => (
                  <OptionCard key={f.value} label={f.label} selected={frequency === f.value} onClick={() => setFrequency(f.value)} />
                ))}
              </div>
              <NextBtn disabled={!frequency} />
            </div>
          )}

          {/* STEP 4 — Distância */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={MapPin} title="Distância média dos treinos?" subtitle="Se você já corre, qual a distância habitual?" />
              <div className="space-y-2">
                {distances.map(d => (
                  <OptionCard key={d.value} label={d.label} selected={avgDistance === d.value} onClick={() => setAvgDistance(d.value)} />
                ))}
              </div>
              <NextBtn disabled={!avgDistance} />
            </div>
          )}

          {/* STEP 5 — Pace */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={Timer} title="Qual é o seu pace médio?" subtitle="Minutos por quilômetro (min/km)." />
              <div className="grid grid-cols-2 gap-2">
                {paces.map(p => (
                  <CompactOptionCard key={p.value} label={p.label} selected={avgPace === p.value} onClick={() => setAvgPace(p.value)} />
                ))}
              </div>
              <NextBtn disabled={!avgPace} />
            </div>
          )}

          {/* STEP 6 — Dias */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={CalendarDays} title="Dias por semana para treinar?" subtitle="Quantos dias você pode dedicar." />
              <div className="grid grid-cols-3 gap-2">
                {daysOptions.map(d => (
                  <CompactOptionCard key={d.value} label={d.label} selected={goalDays === d.value} onClick={() => setGoalDays(d.value)} />
                ))}
              </div>
              <NextBtn disabled={goalDays === null} />
            </div>
          )}

          {/* STEP 7 — Duração */}
          {step === 7 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={Clock} title="Tempo disponível por treino?" subtitle="Quanto tempo você pode treinar por dia." />
              <div className="grid grid-cols-3 gap-2">
                {sessionDurations.map(s => (
                  <CompactOptionCard key={s.value} label={s.label} selected={sessionDuration === s.value} onClick={() => setSessionDuration(s.value)} />
                ))}
              </div>
              <NextBtn disabled={sessionDuration === null} />
            </div>
          )}

          {/* STEP 8 — Lesões (MULTI-SELECT) */}
          {step === 8 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={HeartPulse} title="Tem alguma lesão ou dor?" subtitle="Selecione todas que se aplicam." />
              <div className="space-y-2">
                {injuryOptions.map(i => (
                  <MultiOptionCard key={i.value} label={i.label} selected={selectedInjuries.includes(i.value)} onClick={() => toggleMulti(i.value, selectedInjuries, setSelectedInjuries, 'none')} />
                ))}
              </div>
              <NextBtn disabled={selectedInjuries.length === 0} />
            </div>
          )}

          {/* STEP 9 — Peso/Altura */}
          {step === 9 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={Scale} title="Peso e altura" subtitle="Para calcular gasto calórico e estimativas de performance." />
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Peso (kg)</label>
                  <Input type="number" placeholder="Ex: 70" value={weight} onChange={e => setWeight(e.target.value)} className="h-12 text-base rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Altura (cm)</label>
                  <Input type="number" placeholder="Ex: 175" value={height} onChange={e => setHeight(e.target.value)} className="h-12 text-base rounded-xl" />
                </div>
              </div>
              <NextBtn disabled={!weight || !height} />
            </div>
          )}

          {/* STEP 10 — Intensidade */}
          {step === 10 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={Zap} title="Preferência de intensidade" subtitle="Como você quer que seu treino seja?" />
              <div className="space-y-2">
                {intensityOptions.map(i => (
                  <OptionCard key={i.value} label={i.label} selected={intensity === i.value} onClick={() => setIntensity(i.value)} />
                ))}
              </div>
              <NextBtn disabled={!intensity} />
            </div>
          )}

          {/* STEP 11 — Local (MULTI-SELECT) */}
          {step === 11 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={MapPin} title="Onde você treina?" subtitle="Selecione todos os locais." />
              <div className="space-y-2">
                {locationOptions.map(l => (
                  <MultiOptionCard key={l.value} label={l.label} selected={selectedLocations.includes(l.value)} onClick={() => toggleMulti(l.value, selectedLocations, setSelectedLocations)} />
                ))}
              </div>
              <NextBtn disabled={selectedLocations.length === 0} />
            </div>
          )}

          {/* STEP 12 — Tipos de treino + Strava */}
          {step === 12 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <BackBtn />
              <StepHeader icon={ListChecks} title="O que incluir no plano?" subtitle="Selecione os tipos de treino que deseja." />
              <div className="grid grid-cols-2 gap-2">
                {workoutTypes.map(w => (
                  <CompactOptionCard
                    key={w.value}
                    label={w.label}
                    selected={selectedWorkouts.includes(w.value)}
                    onClick={() => toggleMulti(w.value, selectedWorkouts, setSelectedWorkouts, 'all')}
                  />
                ))}
              </div>

              <div className="border-t border-border pt-5 mt-4 space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold">Conectar Strava</h2>
                  <p className="text-muted-foreground text-xs">
                    Analisamos seus treinos recentes para criar um plano que realmente funciona.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#FC4C02] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                    </svg>
                  </div>
                  <Button onClick={() => void handleStravaConnect()} disabled={selectedWorkouts.length === 0} className="w-full h-14 text-base font-bold rounded-xl">
                    Conectar com Strava
                  </Button>
                  <button
                    onClick={handleFinish}
                    disabled={saving || selectedWorkouts.length === 0}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</span>
                    ) : 'Pular por agora'}
                  </button>
                  <p className="text-xs text-muted-foreground/60 text-center">
                    Nós apenas lemos seus dados de atividade. Nunca postamos ou modificamos nada.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
