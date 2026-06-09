import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const variantClasses: Record<TagVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
};

export function Tag({ children, variant = 'default', onRemove, className, style }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
        variantClasses[variant],
        className
      )}
      style={style}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          className="ml-0.5 rounded-full hover:bg-black/10 transition-colors"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
