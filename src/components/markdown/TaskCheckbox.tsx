'use client';

import { Check } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TaskCheckboxProps {
  /** 체크 상태 */
  checked?: boolean;
  /** 체크박스 인덱스 (토글 시 식별용) */
  index?: number;
  /** 읽기 전용 모드 */
  disabled?: boolean;
  /** 체크 상태 변경 콜백 */
  onChange?: (checked: boolean, index?: number) => void;
  /** 추가 CSS 클래스 */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TaskCheckbox({
  checked = false,
  index,
  disabled = false,
  onChange,
  className,
}: TaskCheckboxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || !onChange) return;
    onChange(!checked, index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (disabled || !onChange) return;
      onChange(!checked, index);
    }
  };

  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'w-[1.125em] h-[1.125em] mt-[0.15em]',
        'rounded border-2 transition-all duration-200 ease-out',
        'flex-shrink-0',

        // Unchecked state
        !checked && ['bg-background border-border', 'hover:border-primary/60'],

        // Checked state
        checked && [
          'bg-primary border-primary',
          // Check icon animation
          '[&>svg]:animate-checkbox-check',
        ],

        // Interactive styles
        !disabled && [
          'cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1',
          'active:scale-95',
        ],

        // Disabled styles
        disabled && ['cursor-not-allowed opacity-60'],

        className
      )}
    >
      <Check
        size={14}
        strokeWidth={3}
        className={cn(
          'transition-all duration-200',
          checked
            ? 'text-primary-foreground opacity-100 scale-100'
            : 'opacity-0 scale-75'
        )}
      />
    </span>
  );
}

// ============================================================================
// Tailwind Animation (add to tailwind.config.ts)
// ============================================================================

/**
 * tailwind.config.ts에 다음 애니메이션 추가:
 *
 * keyframes: {
 *   'checkbox-check': {
 *     '0%': { transform: 'scale(0.5)', opacity: '0' },
 *     '50%': { transform: 'scale(1.1)' },
 *     '100%': { transform: 'scale(1)', opacity: '1' },
 *   },
 * },
 * animation: {
 *   'checkbox-check': 'checkbox-check 0.2s ease-out forwards',
 * },
 */
