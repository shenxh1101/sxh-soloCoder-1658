import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const colorGradients: Record<KpiCardProps['color'], string> = {
  blue: 'from-deep-600 to-deep-500',
  green: 'from-fuel-500 to-fuel-400',
  orange: 'from-orange-500 to-orange-400',
  purple: 'from-repair-500 to-repair-400',
  red: 'from-alert-red to-red-400',
};

function getTrendColor(isUp: boolean): string {
  return isUp ? 'text-alert-red' : 'text-fuel-500';
}

export default function KpiCard({ icon: Icon, title, value, trend, color }: KpiCardProps) {
  const isNumeric = typeof value === 'number';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-deep-400 mb-2">{title}</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className={cn(
                'kpi-value text-deep-700',
                isNumeric && 'font-mono'
              )}
            >
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  getTrendColor(trend.isUp)
                )}
              >
                {trend.isUp ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md',
            colorGradients[color]
          )}
        >
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
