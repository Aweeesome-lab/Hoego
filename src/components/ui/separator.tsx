import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 구분선의 방향
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * 장식적 요소인지 여부
   * @default true
   */
  decorative?: boolean;
}

/**
 * Separator 컴포넌트
 *
 * @example
 * ```tsx
 * <Separator />
 * <Separator orientation="vertical" className="h-8" />
 * <Separator decorative={false} />
 * ```
 */
function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
}

export { Separator };
