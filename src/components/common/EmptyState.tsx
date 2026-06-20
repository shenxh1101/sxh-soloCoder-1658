import type { LucideIcon } from 'lucide-react';
import { Package } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-deep-300" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-deep-600 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-deep-400 max-w-sm mb-5">{description}</p>
      )}
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
