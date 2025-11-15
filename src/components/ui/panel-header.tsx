import * as React from 'react';

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 패널 제목
   */
  title: string;

  /**
   * 오른쪽 영역에 들어갈 액션 버튼들
   */
  actions?: React.ReactNode;

  /**
   * 다크 모드
   */
  isDarkMode?: boolean;

  /**
   * 높이
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-14',
};

/**
 * 패널 헤더 컴포넌트 - Hoego 앱의 일관된 패널 헤더 스타일
 *
 * @example
 * ```tsx
 * <PanelHeader title="쏟아내기(dump)" />
 *
 * <PanelHeader
 *   title="회고하기(retrospect)"
 *   actions={
 *     <>
 *       <StatusBadge>저장 중</StatusBadge>
 *       <PillButton icon={<Settings />} iconOnly />
 *     </>
 *   }
 * />
 * ```
 */
export const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  (
    {
      className = '',
      title,
      actions,
      isDarkMode = false,
      size = 'md',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          flex items-center justify-between
          border-b
          px-3.5
          ${sizeClasses[size]}
          ${
            isDarkMode
              ? 'border-slate-200/20'
              : 'border-slate-200'
          }
          ${className}
        `}
        {...props}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
          {title}
        </span>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

PanelHeader.displayName = 'PanelHeader';
