import { Home, Calendar, Activity, UserRound } from 'lucide-react';

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'training', label: 'Training', icon: Calendar },
  { id: 'history', label: 'History', icon: Activity },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

interface Props {
  active: string;
  onChange: (tab: string) => void;
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
