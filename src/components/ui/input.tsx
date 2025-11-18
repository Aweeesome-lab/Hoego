import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * 에러 상태
   */
  error?: boolean;
  /**
   * 성공 상태
   */
  success?: boolean;
}

/**
 * Input 컴포넌트
 *
 * @example
 * ```tsx
 * <Input placeholder="이메일을 입력하세요" />
 * <Input type="password" error />
 * <Input value="Success!" success />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          success && 'border-green-500 focus-visible:ring-green-500',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
