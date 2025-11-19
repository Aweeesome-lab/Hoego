import { Check } from 'lucide-react';
import * as React from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /**
   * 체크박스 레이블
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
   * 불확정 상태 (일부만 선택된 상태)
   */
  indeterminate?: boolean;

  /**
   * 체크 상태 변경 핸들러
   */
  onCheckedChange?: (checked: boolean) => void;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

const labelSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * 체크박스 컴포넌트
 *
 * @example
 * ```tsx
 * <Checkbox label="동의합니다" />
 * <Checkbox checked={true} onCheckedChange={(checked) => console.log(checked)} />
 * <Checkbox indeterminate size="lg" label="일부 선택" />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className = '',
      label,
      labelPosition = 'right',
      size = 'md',
      checked,
      indeterminate,
      onCheckedChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
      props.onChange?.(e);
    };

    const isChecked = checked || indeterminate;

    return (
      <label
        className={`
          inline-flex items-center gap-2 cursor-pointer
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
            ref={inputRef}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="sr-only"
            {...props}
          />
          <div
            className={`
              ${sizeClasses[size]}
              rounded border-2
              transition-all duration-150
              flex items-center justify-center
              ${
                isChecked
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${className}
            `}
          >
            {isChecked && (
              <Check
                className={`${iconSizeClasses[size]} text-white`}
                strokeWidth={3}
              />
            )}
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

Checkbox.displayName = 'Checkbox';
