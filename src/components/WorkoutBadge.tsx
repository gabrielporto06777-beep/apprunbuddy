import { getSessionBadgeClasses, getSessionDisplayName } from '@/lib/supabase-helpers';

export default function WorkoutBadge({ type }: { type: string }) {
  const label = getSessionDisplayName(type);
  if (type === 'Descanso' || type === 'Rest') return <span className="text-xs text-badge-descanso-fg">{label}</span>;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSessionBadgeClasses(type)}`}>
      {label}
    </span>
  );
}
