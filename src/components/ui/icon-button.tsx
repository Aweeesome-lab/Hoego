import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, forwardRef } from 'react';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-white/10 dark:bg-[#0a0d13]/80 dark:text-slate-400 dark:hover:text-slate-200',
        active:
          'border-slate-300 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-200',
        ghost:
          'border-white/10 bg-[#0a0d13]/80 text-slate-300 hover:bg-white/10 dark:border-white/10 dark:bg-[#0a0d13]/80 dark:text-slate-300 dark:hover:bg-white/10',
      },
      size: {
        default: 'h-8 w-8',
        sm: 'h-7 w-7',
        lg: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /**
   * 활성화 상태 (패널 토글 등에 사용)
   */
  active?: boolean;
}

/**
 * IconButton 컴포넌트 - Hoego 스타일 아이콘 전용 버튼
 *
 * @example
 * ```tsx
 * <IconButton>
 *   <Search className="h-4 w-4" />
 * </IconButton>
 *
 * <IconButton active>
 *   <Brain className="h-4 w-4" />
 * </IconButton>
 * ```
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, active, ...props }, ref) => {
    const computedVariant = active ? 'active' : variant;

    return (
      <button
        className={cn(
          iconButtonVariants({ variant: computedVariant, size, className })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton, iconButtonVariants };
