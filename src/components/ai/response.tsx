import * as React from 'react';

import { cn } from '@/lib/utils';

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  isDarkMode?: boolean;
}

export const Response = React.memo(function Response({
  children,
  className,
  isDarkMode,
  ...props
}: ResponseProps) {
  return (
    <div
      className={cn(
        'rounded-2xl px-4 py-3 transition',
        isDarkMode ? 'bg-white/5 text-slate-100' : 'bg-white text-slate-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
