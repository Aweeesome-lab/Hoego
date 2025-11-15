import * as React from 'react';
import { Loader2 } from 'lucide-react';

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 버튼 변형
   * - "default": 기본 스타일
   * - "active": 활성화 상태 (선택됨)
   * @default "default"
   */
  variant?: 'default' | 'active';

  /**
   * 버튼 크기
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 아이콘 (왼쪽)
   */
  icon?: React.ReactNode;

  /**
   * 아이콘만 표시 (텍스트 없음)
   */
  iconOnly?: boolean;

  /**
   * 로딩 상태
   */
  loading?: boolean;

  /**
   * 다크 모드
   */
  isDarkMode?: boolean;
}

const sizeClasses = {
  sm: {
    button: 'h-7 text-xs',
    iconOnly: 'w-7',
    padding: 'px-2.5',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },
  md: {
    button: 'h-8 text-xs',
    iconOnly: 'w-8',
    padding: 'px-3',
    icon: 'h-3.5 w-3.5',
    gap: 'gap-1.5',
  },
  lg: {
    button: 'h-9 text-sm',
    iconOnly: 'w-9',
    padding: 'px-4',
    icon: 'h-4 w-4',
    gap: 'gap-2',
  },
};

/**
 * Pill 버튼 컴포넌트 - Hoego 앱에서 실제로 사용하는 둥근 버튼 스타일
 *
 * @example
 * ```tsx
 * // 기본 버튼
 * <PillButton>버튼</PillButton>
 *
 * // 아이콘 + 텍스트
 * <PillButton icon={<Clock />}>14:30</PillButton>
 *
 * // 아이콘만
 * <PillButton icon={<Pencil />} iconOnly />
 *
 * // 활성화 상태
 * <PillButton variant="active" icon={<Brain />} iconOnly />
 *
 * // 로딩 상태
 * <PillButton loading icon={<Sparkles />}>AI 피드백</PillButton>
 * ```
 */
export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      icon,
      iconOnly = false,
      loading = false,
      isDarkMode = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeConfig = sizeClasses[size];

    // 스타일 계산
    const baseStyles = `
      inline-flex items-center justify-center
      rounded-full border
      font-medium transition
      disabled:opacity-60 disabled:cursor-not-allowed
      ${sizeConfig.button}
      ${iconOnly ? sizeConfig.iconOnly : sizeConfig.padding}
      ${!iconOnly && icon ? sizeConfig.gap : ''}
    `;

    const variantStyles =
      variant === 'active'
        ? isDarkMode
          ? 'border-white/20 bg-white/10 text-slate-200'
          : 'border-slate-300 bg-slate-100 text-slate-700'
        : isDarkMode
          ? 'border-white/10 bg-[#0a0d13]/80 text-slate-300 hover:bg-white/5 hover:border-white/20'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300';

    // 아이콘 렌더링
    const renderIcon = () => {
      if (loading) {
        return <Loader2 className={`${sizeConfig.icon} animate-spin`} />;
      }
      if (icon) {
        // 아이콘이 이미 lucide-react 컴포넌트이므로 직접 클론해서 클래스 추가
        return React.cloneElement(icon as React.ReactElement, {
          className: sizeConfig.icon,
        });
      }
      return null;
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {renderIcon()}
        {!iconOnly && children}
      </button>
    );
  }
);

PillButton.displayName = 'PillButton';
