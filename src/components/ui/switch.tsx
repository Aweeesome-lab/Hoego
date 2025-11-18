import * as React from 'react';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /**
   * 스위치 레이블
   */
  label?: React.ReactNode;

  /**
   * 레이블 위치
   * @default "right"
   */
  labelPosition?: 'left' | 'right';

  /**
   * 크기
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 체크 상태
   */
  checked?: boolean;

  /**
   * 체크 상태 변경 핸들러
   */
  onCheckedChange?: (checked: boolean) => void;

  /**
   * 커스텀 아이콘 (선택됨)
   */
  checkedIcon?: React.ReactNode;

  /**
   * 커스텀 아이콘 (선택 안됨)
   */
  uncheckedIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: {
    container: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    container: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    container: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
  },
};

const labelSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * 스위치 토글 컴포넌트
 *
 * @example
 * ```tsx
 * <Switch label="알림 받기" />
 * <Switch checked={true} onCheckedChange={(checked) => console.log(checked)} />
 * <Switch size="lg" label="다크 모드" />
 * ```
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className = '',
      label,
      labelPosition = 'right',
      size = 'md',
      checked,
      onCheckedChange,
      disabled,
      checkedIcon,
      uncheckedIcon,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      props.onChange?.(e);
    };

    return (
      <label
        className={`
          inline-flex items-center gap-3 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {label && labelPosition === 'left' && (
          <span className={`${labelSizeClasses[size]} select-none`}>
            {label}
          </span>
        )}

        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="sr-only"
            {...props}
          />
          <div
            className={`
              ${sizeClasses[size].container}
              rounded-full
              transition-colors duration-200
              cursor-pointer
              relative
              ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${className}
            `}
          >
            <div
              className={`
                ${sizeClasses[size].thumb}
                absolute left-0.5 top-1/2 -translate-y-1/2
                bg-white
                rounded-full
                shadow-md
                transition-transform duration-200
                flex items-center justify-center
                ${checked ? sizeClasses[size].translate : ''}
              `}
            >
              {checked && checkedIcon}
              {!checked && uncheckedIcon}
            </div>
          </div>
        </div>

        {label && labelPosition === 'right' && (
          <span className={`${labelSizeClasses[size]} select-none`}>
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
