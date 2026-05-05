import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AuthPage from './AuthPage';
import OnboardingPage from './OnboardingPage';
import BottomNav from '@/components/BottomNav';
import HomeTab from './tabs/HomeTab';
import TrainingTab from './tabs/TrainingTab';
import HistoryTab from './tabs/HistoryTab';
import ProfileTab from './tabs/ProfileTab';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile();
  const [activeTab, setActiveTab] = useState('home');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (profile) {
      setOnboarded(!!profile.name);
    } else if (!profileLoading && user) {
      setOnboarded(false);
    }
  }, [profile, profileLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="w-16 h-16 rounded-2xl" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (onboarded === null || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="w-16 h-16 rounded-2xl" />
      </div>
    );
  }

  if (!onboarded) {
    return <OnboardingPage onComplete={() => { refetch(); setOnboarded(true); }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {activeTab === 'home' && <HomeTab onNavigate={setActiveTab} />}
      {activeTab === 'training' && <TrainingTab />}
      {activeTab === 'history' && <HistoryTab />}
      {activeTab === 'profile' && <ProfileTab />}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
