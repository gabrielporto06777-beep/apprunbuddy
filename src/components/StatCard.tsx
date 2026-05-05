import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  bgColor?: string;
}

export default function StatCard({ icon: Icon, label, value, subtitle }: Props) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
