import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'pending'
  | 'routine'
  | 'fault'
  | 'overhaul';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-fuel-500/10 text-fuel-600 border border-fuel-500/20',
  warning: 'bg-alert-yellow/10 text-yellow-700 border border-alert-yellow/30',
  danger: 'bg-alert-red/10 text-alert-red border border-alert-red/20',
  info: 'bg-deep-500/10 text-deep-600 border border-deep-500/20',
  pending: 'bg-orange-500/10 text-orange-600 border border-orange-500/20',
  routine: 'bg-fuel-500/10 text-fuel-600 border border-fuel-500/20',
  fault: 'bg-alert-red/10 text-alert-red border border-alert-red/20',
  overhaul: 'bg-repair-500/10 text-repair-600 border border-repair-500/20',
};

const variantDot: Record<BadgeVariant, string> = {
  success: 'bg-fuel-500',
  warning: 'bg-alert-yellow',
  danger: 'bg-alert-red',
  info: 'bg-deep-500',
  pending: 'bg-orange-500',
  routine: 'bg-fuel-500',
  fault: 'bg-alert-red',
  overhaul: 'bg-repair-500',
};

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variantStyles[variant],
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          variantDot[variant]
        )}
      />
      {children}
    </span>
  );
}
