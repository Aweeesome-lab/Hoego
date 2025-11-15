import * as React from 'react';

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * 상태 변형
   * @default "default"
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';

  /**
   * 크기
   * @default "sm"
   */
  size?: 'xs' | 'sm' | 'md';

  /**
   * 다크 모드
   */
  isDarkMode?: boolean;

  /**
   * 점 표시 (펄스 애니메이션)
   */
  showDot?: boolean;

  /**
   * 펄스 애니메이션
   */
  pulse?: boolean;
}

const sizeClasses = {
  xs: 'px-2 py-0.5 text-[9px]',
  sm: 'px-3 py-1 text-[10px]',
  md: 'px-4 py-1.5 text-xs',
};

const variantClasses = {
  default: {
    light: 'bg-slate-200 text-slate-700',
    dark: 'bg-white/10 text-slate-200',
  },
  success: {
    light: 'bg-green-100 text-green-700',
    dark: 'bg-green-900/30 text-green-300',
  },
  warning: {
    light: 'bg-yellow-100 text-yellow-700',
    dark: 'bg-yellow-900/30 text-yellow-300',
  },
  error: {
    light: 'bg-red-100 text-red-700',
    dark: 'bg-red-900/30 text-red-300',
  },
  info: {
    light: 'bg-blue-100 text-blue-700',
    dark: 'bg-blue-900/30 text-blue-300',
  },
};

const dotClasses = {
  default: {
    light: 'bg-slate-500',
    dark: 'bg-slate-400',
  },
  success: {
    light: 'bg-green-500',
    dark: 'bg-green-400',
  },
  warning: {
    light: 'bg-yellow-500',
    dark: 'bg-yellow-400',
  },
  error: {
    light: 'bg-red-500',
    dark: 'bg-red-400',
  },
  info: {
    light: 'bg-blue-500',
    dark: 'bg-blue-400',
  },
};

/**
 * 상태 배지 컴포넌트 - Hoego 앱의 "편집 중", "저장 중" 등 상태 표시에 사용
 *
 * @example
 * ```tsx
 * <StatusBadge>편집 중</StatusBadge>
 * <StatusBadge variant="success">저장 완료</StatusBadge>
 * <StatusBadge showDot pulse>저장 중</StatusBadge>
 * ```
 */
export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'sm',
      isDarkMode = false,
      showDot = false,
      pulse = false,
      children,
      ...props
    },
    ref
  ) => {
    const colorMode = isDarkMode ? 'dark' : 'light';
    const variantStyle = variantClasses[variant][colorMode];
    const dotStyle = dotClasses[variant][colorMode];

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5
          rounded-full
          font-medium
          ${sizeClasses[size]}
          ${variantStyle}
          ${className}
        `}
        {...props}
      >
        {showDot && (
          <span
            className={`
              h-1.5 w-1.5 rounded-full
              ${dotStyle}
              ${pulse ? 'animate-pulse' : ''}
            `}
          />
        )}
        {children}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
