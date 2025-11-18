import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'size' | 'onChange'
  > {
  /**
   * 선택 옵션 목록
   */
  options: SelectOption[];

  /**
   * 선택된 값
   */
  value?: string;

  /**
   * 값 변경 핸들러
   */
  onValueChange?: (value: string) => void;

  /**
   * 플레이스홀더 텍스트
   */
  placeholder?: string;

  /**
   * 크기
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 에러 상태
   */
  error?: boolean;

  /**
   * 전체 너비
   */
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-base px-4',
  lg: 'h-12 text-lg px-5',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * 셀렉트 드롭다운 컴포넌트
 *
 * @example
 * ```tsx
 * <Select
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *   ]}
 *   placeholder="선택하세요"
 * />
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      options,
      value,
      onValueChange,
      placeholder,
      size = 'md',
      error,
      fullWidth,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onValueChange?.(e.target.value);
    };

    return (
      <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
        <select
          ref={ref}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            ${fullWidth ? 'w-full' : 'min-w-[200px]'}
            appearance-none
            rounded-lg
            border-2
            ${
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            pr-10
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`
            ${iconSizeClasses[size]}
            absolute right-3 top-1/2 -translate-y-1/2
            text-gray-400 dark:text-gray-500
            pointer-events-none
          `}
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * 커스텀 셀렉트 컴포넌트 (더 많은 커스터마이징 가능)
 */
export interface CustomSelectProps extends Omit<SelectProps, 'options'> {
  options: SelectOption[];
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
  (
    {
      className = '',
      options,
      value,
      onValueChange,
      placeholder,
      size = 'md',
      error,
      fullWidth,
      disabled,
      renderOption,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => containerRef.current!);

    const selectedOption = options.find((opt) => opt.value === value);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue);
      setIsOpen(false);
    };

    return (
      <div
        ref={containerRef}
        className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            ${fullWidth ? 'w-full' : 'min-w-[200px]'}
            flex items-center justify-between
            rounded-lg
            border-2
            ${
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${className}
          `}
        >
          <span className={selectedOption ? '' : 'text-gray-400'}>
            {selectedOption
              ? renderOption
                ? renderOption(selectedOption)
                : selectedOption.label
              : placeholder || '선택하세요'}
          </span>
          <ChevronDown
            className={`
              ${iconSizeClasses[size]}
              text-gray-400 dark:text-gray-500
              transition-transform
              ${isOpen ? 'rotate-180' : ''}
            `}
          />
        </button>

        {isOpen && (
          <div
            className={`
              absolute z-50 mt-2 w-full
              bg-white dark:bg-gray-800
              border-2 border-gray-300 dark:border-gray-600
              rounded-lg shadow-lg
              max-h-60 overflow-auto
            `}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={`
                  w-full flex items-center justify-between
                  px-4 py-2 text-left
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                  ${option.value === value ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <span>
                  {renderOption ? renderOption(option) : option.label}
                </span>
                {option.value === value && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';
