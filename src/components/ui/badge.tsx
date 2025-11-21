import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500 text-white hover:bg-green-500/80',
        warning:
          'border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80',
        info: 'border-transparent bg-matcha text-white hover:bg-matcha/80',
        // Subtle variants (from StatusBadge)
        'subtle-default':
          'border-transparent bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20',
        'subtle-success':
          'border-transparent bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50',
        'subtle-warning':
          'border-transparent bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50',
        'subtle-error':
          'border-transparent bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
        'subtle-info':
          'border-transparent bg-matcha-100 text-matcha-600 hover:bg-matcha-200 dark:bg-[#5c8a6c]/30 dark:text-matcha-300 dark:hover:bg-[#5c8a6c]/50',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        xs: 'px-2 py-0.5 text-[9px]',
        sm: 'px-3 py-1 text-[10px]',
        md: 'px-4 py-1.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * 점 표시 (펄스 애니메이션)
   */
  showDot?: boolean;
  /**
   * 펄스 애니메이션
   */
  pulse?: boolean;
}

/**
 * Badge 컴포넌트
 *
 * @example
 * ```tsx
 * <Badge>New</Badge>
 * <Badge variant="subtle-success" showDot pulse>Saving...</Badge>
 * ```
 */
function Badge({
  className,
  variant,
  size,
  showDot,
  pulse,
  children,
  ...props
}: BadgeProps) {
  const dotColorClass = {
    default: 'bg-primary',
    secondary: 'bg-secondary-foreground',
    destructive: 'bg-destructive-foreground',
    outline: 'bg-foreground',
    success: 'bg-white',
    warning: 'bg-white',
    info: 'bg-white',
    'subtle-default': 'bg-slate-500 dark:bg-slate-400',
    'subtle-success': 'bg-green-500 dark:bg-green-400',
    'subtle-warning': 'bg-yellow-500 dark:bg-yellow-400',
    'subtle-error': 'bg-red-500 dark:bg-red-400',
    'subtle-info': 'bg-matcha dark:bg-matcha-300',
  }[variant || 'default'];

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            dotColorClass,
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
