import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}

const variantGradients: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  default: 'from-deep-500 to-deep-400',
  success: 'from-fuel-500 to-fuel-400',
  warning: 'from-alert-yellow to-yellow-400',
  danger: 'from-alert-red to-red-400',
};

function getVariant(value: number): NonNullable<ProgressBarProps['variant']> {
  if (value >= 90) return 'danger';
  if (value >= 70) return 'warning';
  if (value >= 40) return 'success';
  return 'default';
}

export default function ProgressBar({
  value,
  variant,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const resolvedVariant = variant ?? getVariant(clampedValue);
  const gradient = variantGradients[resolvedVariant];

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-deep-400">进度</span>
          <span className="text-xs font-mono font-medium text-deep-600">
            {clampedValue.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-deep-50 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out',
            gradient
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
