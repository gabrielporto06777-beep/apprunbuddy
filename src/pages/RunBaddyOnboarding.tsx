import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, Target, Timer, Trophy, Flame, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getStravaAuthUrl } from '@/lib/strava';


const goals = [
  { value: '5k', label: '5K', subtitle: 'Build your base', icon: Target, distance: '5 km' },
  { value: '10k', label: '10K', subtitle: 'Push your limits', icon: Timer, distance: '10 km' },
  { value: 'half', label: 'Half Marathon', subtitle: 'Go the distance', icon: Trophy, distance: '21 km' },
  { value: 'full', label: 'Full Marathon', subtitle: 'The ultimate challenge', icon: Flame, distance: '42 km' },
];

export default function RunBaddyOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [raceDate, setRaceDate] = useState<Date>();

  // Check if returning from Strava OAuth → go to step 4
  useEffect(() => {
    const fromStrava = searchParams.get('from_strava');
    if (fromStrava === 'true') {
      setStep(4);
      const timer = setTimeout(() => navigate('/dashboard'), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

  const handleStravaConnect = async () => {
    localStorage.setItem('runbuddy_goal', goal);
    if (raceDate) localStorage.setItem('runbuddy_race_date', raceDate.toISOString());

    try {
      const stravaAuthUrl = await getStravaAuthUrl();
      window.open(stravaAuthUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to start Strava OAuth', error);
    }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Progress indicator */}
      {step <= 3 && (
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium tracking-wide">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  s <= step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* STEP 1 — Goal */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">What's your goal?</h1>
                <p className="text-muted-foreground">Choose the race distance you're training for.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {goals.map((g) => {
                  const Icon = g.icon;
                  const selected = goal === g.value;
                  return (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={cn(
                        'flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all duration-150',
                        'active:scale-[0.97]',
                        selected
                          ? 'border-primary bg-card'
                          : 'border-border bg-card hover:border-muted-foreground/40'
                      )}
                    >
                      <Icon className={cn('w-6 h-6', selected ? 'text-primary' : 'text-muted-foreground')} />
                      <div>
                        <p className="font-bold text-lg leading-tight">{g.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{g.subtitle}</p>
                      </div>
                      <span className={cn('text-xs font-semibold', selected ? 'text-primary' : 'text-muted-foreground')}>
                        {g.distance}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!goal}
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-xl active:scale-[0.97] transition-transform"
              >
                Next
              </Button>
            </div>
          )}

          {/* STEP 2 — Race Date */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">When is your race?</h1>
                <p className="text-muted-foreground">Don't have a race yet? Pick a rough target date.</p>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-14 justify-start text-left font-medium rounded-xl border-2 bg-card hover:bg-secondary',
                      raceDate ? 'border-primary text-foreground' : 'border-border text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {raceDate ? format(raceDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={raceDate}
                    onSelect={setRaceDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Button
                onClick={() => setStep(3)}
                disabled={!raceDate}
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-xl active:scale-[0.97] transition-transform"
              >
                Next
              </Button>
            </div>
          )}

          {/* STEP 3 — Connect Strava */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Connect your Strava</h1>
                <p className="text-muted-foreground">
                  We'll analyze your recent runs to build a plan that actually fits you.
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 py-8">
                <div className="w-20 h-20 rounded-2xl bg-[#FC4C02] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>

                <Button
                  onClick={() => {
                    void handleStravaConnect();
                  }}
                  className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl active:scale-[0.97] transition-transform"
                >
                  Connect with Strava
                </Button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Skip for now
                </button>

                <p className="text-xs text-muted-foreground/60 text-center">
                  We only read your activity data. We never post or modify anything.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 — Loading */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center gap-6 py-16 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
                  <span className="text-2xl font-black text-primary-foreground tracking-tighter">RB</span>
                </div>
                <Loader2 className="absolute -top-3 -right-3 w-8 h-8 text-primary animate-spin" />
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight">Analyzing your runs...</h1>
                <p className="text-muted-foreground">Our AI coach is building your personalized plan.</p>
              </div>

              <div className="flex gap-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
