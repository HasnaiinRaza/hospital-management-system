interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'pink' | 'amber' | 'purple';
  trend?: { value: number; label: string };
}

const COLOR_MAP = {
  green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700', border: 'border-emerald-100' },
  blue:   { bg: 'bg-blue-50',    icon: 'bg-blue-100 text-blue-600',       text: 'text-blue-700',    border: 'border-blue-100' },
  pink:   { bg: 'bg-pink-50',    icon: 'bg-pink-100 text-pink-600',       text: 'text-pink-700',    border: 'border-pink-100' },
  amber:  { bg: 'bg-amber-50',   icon: 'bg-amber-100 text-amber-600',     text: 'text-amber-700',   border: 'border-amber-100' },
  purple: { bg: 'bg-purple-50',  icon: 'bg-purple-100 text-purple-600',   text: 'text-purple-700',  border: 'border-purple-100' },
};

export default function StatsCard({ title, value, subtitle, icon, color = 'green', trend }: StatsCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`card-hover rounded-2xl border ${c.border} ${c.bg} p-5 flex items-start gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend && (
          <div className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </div>
  );
}
