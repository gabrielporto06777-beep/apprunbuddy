import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatPace, formatDuration } from '@/lib/supabase-helpers';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Square, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface GeoPoint { lat: number; lng: number; timestamp: number }
interface Split { km: number; pace_seconds: number }

export default function RunTab() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  const [phase, setPhase] = useState<'pre' | 'running' | 'paused' | 'summary'>('pre');
  const [audioCoach, setAudioCoach] = useState(true);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [route, setRoute] = useState<GeoPoint[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [gpsError, setGpsError] = useState('');

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const lastKmRef = useRef(0);
  const lastKmTimeRef = useRef(0);
  const autoPauseRef = useRef<number | null>(null);

  useEffect(() => {
    if (profile) setAudioCoach(profile.audio_coach_enabled ?? true);
  }, [profile]);

  const speak = useCallback((text: string) => {
    if (!audioCoach) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      speechSynthesis.speak(u);
    } catch {}
  }, [audioCoach]);

  const vibrate = (ms: number) => {
    try { navigator.vibrate?.(ms); } catch {}
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const startRun = () => {
    if (!navigator.geolocation) { setGpsError('GPS not available'); return; }

    navigator.geolocation.getCurrentPosition(
      () => {
        setPhase('running');
        setDistance(0); setElapsed(0); setRoute([]); setSplits([]);
        lastKmRef.current = 0; lastKmTimeRef.current = 0;
        vibrate(200);
        speak("Run started. Let's go!");

        timerRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            const ts = Date.now();
            const point: GeoPoint = { lat, lng, timestamp: ts };

            setRoute(r => [...r, point]);

            if (lastPosRef.current) {
              const d = getDistance(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng);

              if (d > 2) {
                setDistance(prev => {
                  const newDist = prev + d;
                  const kmDone = Math.floor(newDist / 1000);
                  if (kmDone > lastKmRef.current) {
                    const kmTime = Math.round((ts - (lastKmTimeRef.current || ts)) / 1000);
                    const paceForKm = kmTime > 0 ? kmTime : 0;
                    setSplits(s => [...s, { km: kmDone, pace_seconds: paceForKm }]);
                    lastKmRef.current = kmDone;
                    lastKmTimeRef.current = ts;
                    vibrate(100);
                    speak(`${kmDone} kilometer${kmDone > 1 ? 's' : ''}. Current pace: ${formatPace(paceForKm)} per kilometer.`);
                    toast(`${kmDone} km - Pace: ${formatPace(paceForKm)}/km`);
                  }
                  return newDist;
                });
              }
            } else {
              lastKmTimeRef.current = ts;
            }
            lastPosRef.current = { lat, lng, time: ts };
          },
          (err) => setGpsError(err.message),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
      },
      (err) => setGpsError(`GPS permission denied: ${err.message}`),
      { enableHighAccuracy: true }
    );
  };

  const pauseRun = () => {
    setPhase('paused');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resumeRun = () => {
    setPhase('running');
    timerRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopRun = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    vibrate(400);
    speak('Workout complete! Great job!');
    setPhase('summary');
  };

  const distKm = distance / 1000;
  const avgPaceSec = elapsed > 0 && distKm > 0 ? Math.round(elapsed / distKm) : 0;
  const currentPace = (() => {
    if (route.length < 2) return 0;
    const last = route[route.length - 1];
    const prev = route[Math.max(0, route.length - 5)];
    const d = getDistance(prev.lat, prev.lng, last.lat, last.lng);
    const t = (last.timestamp - prev.timestamp) / 1000;
    if (d <= 0) return 0;
    return Math.round(t / (d / 1000));
  })();
  const calories = Math.round(distKm * 60);

  const saveRun = async () => {
    if (!user) return;
    const { error } = await supabase.from('runs').insert({
      user_id: user.id,
      distance_km: Math.round(distKm * 100) / 100,
      duration_seconds: elapsed,
      avg_pace_seconds: avgPaceSec,
      calories,
      route_geojson: route as any,
      splits: splits as any,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Run saved!');
    qc.invalidateQueries({ queryKey: ['runs'] });
    setPhase('pre');
  };

  const discard = () => setPhase('pre');

  if (phase === 'pre') {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6 flex flex-col items-center justify-center min-h-[70vh]">
        {gpsError && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-2xl text-sm w-full text-center">{gpsError}</div>
        )}
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center relative">
          <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center absolute animate-pulse-ring" />
          <MapPin className="w-12 h-12 text-primary" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground">Audio Coach</span>
          <Switch checked={audioCoach} onCheckedChange={setAudioCoach} />
        </div>
        <Button onClick={startRun} className="w-full max-w-xs h-14 text-lg font-bold rounded-2xl">
          Start Run
        </Button>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <h2 className="text-xl font-bold text-foreground text-center">Run Summary</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{distKm.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">km</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatDuration(elapsed)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{avgPaceSec ? formatPace(avgPaceSec) : '--'}</p>
            <p className="text-xs text-muted-foreground">Avg Pace</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{calories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
        </div>
        {splits.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Splits</h3>
            <div className="space-y-1">
              {splits.map(s => (
                <div key={s.km} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Km {s.km}</span>
                  <span className="font-medium text-foreground">{formatPace(s.pace_seconds)}/km</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" onClick={discard} className="flex-1">Discard</Button>
          <Button onClick={saveRun} className="flex-1">Save Run</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-foreground/95 z-40 flex flex-col items-center justify-center text-primary-foreground safe-bottom">
      <div className="space-y-8 text-center">
        <div>
          <p className="text-6xl font-bold">{distKm.toFixed(2)}</p>
          <p className="text-sm opacity-70">km</p>
        </div>
        <div>
          <p className="text-4xl font-bold font-mono">{formatDuration(elapsed)}</p>
        </div>
        <div className="flex gap-8 justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{currentPace ? formatPace(currentPace) : '--:--'}</p>
            <p className="text-xs opacity-70">Current Pace</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{avgPaceSec ? formatPace(avgPaceSec) : '--:--'}</p>
            <p className="text-xs opacity-70">Avg Pace</p>
          </div>
        </div>
      </div>
      <div className="flex gap-6 mt-12">
        {phase === 'running' ? (
          <button onClick={pauseRun} className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Pause className="w-8 h-8" />
          </button>
        ) : (
          <button onClick={resumeRun} className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Play className="w-8 h-8" />
          </button>
        )}
        <button onClick={stopRun} className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
          <Square className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
