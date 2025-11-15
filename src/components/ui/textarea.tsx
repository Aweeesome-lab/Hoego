import * as React from 'react';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * 레이블
   */
  label?: string;

  /**
   * 에러 메시지
   */
  error?: string;

  /**
   * 도움말 텍스트
   */
  helperText?: string;

  /**
   * 크기
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 자동 높이 조절
   */
  autoResize?: boolean;

  /**
   * 최소 행 수 (autoResize 사용 시)
   */
  minRows?: number;

  /**
   * 최대 행 수 (autoResize 사용 시)
   */
  maxRows?: number;

  /**
   * 글자 수 표시
   */
  showCount?: boolean;

  /**
   * 최대 글자 수
   */
  maxLength?: number;

  /**
   * 전체 너비
   */
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: 'text-sm px-3 py-2 min-h-[80px]',
  md: 'text-base px-4 py-2.5 min-h-[100px]',
  lg: 'text-lg px-5 py-3 min-h-[120px]',
};

/**
 * 텍스트 영역 컴포넌트
 *
 * @example
 * ```tsx
 * <Textarea placeholder="메모를 입력하세요" />
 * <Textarea label="내용" autoResize showCount maxLength={200} />
 * ```
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      size = 'md',
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      showCount = false,
      maxLength,
      fullWidth = true,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-resize logic
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';

        const computed = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computed.lineHeight);
        const paddingTop = parseFloat(computed.paddingTop);
        const paddingBottom = parseFloat(computed.paddingBottom);

        const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
        const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

        textarea.style.height = `${newHeight}px`;
      }
    }, [value, autoResize, minRows, maxRows]);

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
        {label && (
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            className={`
              ${sizeClasses[size]}
              ${fullWidth ? 'w-full' : 'min-w-[300px]'}
              ${autoResize ? 'resize-none' : 'resize-y'}
              rounded-lg
              border-2
              ${
                error
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
              }
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              ${showCount && maxLength ? 'pb-8' : ''}
              ${className}
            `}
            {...props}
          />

          {showCount && maxLength && (
            <div
              className={`
                absolute bottom-2 right-3
                text-xs
                ${
                  currentLength > maxLength * 0.9
                    ? 'text-red-500'
                    : 'text-gray-400 dark:text-gray-500'
                }
              `}
            >
              {currentLength} / {maxLength}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={`
              mt-1.5 text-sm
              ${error ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}
            `}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
