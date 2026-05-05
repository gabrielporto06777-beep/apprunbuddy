import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStravaAuthUrl } from '@/lib/strava';

const DISMISS_KEY = 'strava_banner_dismissed';

export default function StravaBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === 'true'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  const handleConnect = async () => {
    try {
      const stravaAuthUrl = await getStravaAuthUrl();
      window.open(stravaAuthUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to start Strava OAuth', error);
    }
  };

  return (
    <div className="relative bg-card border border-border rounded-2xl p-5 shadow-sm">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FC4C02] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Connect your Strava</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sync your runs and get a training plan built for you.
            </p>
          </div>
          <Button
            onClick={() => {
              void handleConnect();
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl active:scale-[0.97] transition-transform"
          >
            Connect with Strava
          </Button>
          <p className="text-xs text-muted-foreground">You can skip this and connect later.</p>
        </div>
      </div>
    </div>
  );
}
