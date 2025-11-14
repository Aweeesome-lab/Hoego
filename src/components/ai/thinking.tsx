import * as React from 'react';

interface ThinkingIndicatorProps {
  isDarkMode?: boolean;
}

export const ThinkingIndicator = React.memo(function ThinkingIndicator({
  isDarkMode,
}: ThinkingIndicatorProps) {
  const textColor = isDarkMode ? 'text-slate-300' : 'text-slate-500';
  const dotColor = isDarkMode ? 'bg-slate-400' : 'bg-slate-300';

  return (
    <div
      className={`inline-flex items-center gap-2 text-sm font-medium ${textColor}`}
    >
      <span>thinking…</span>
      <span className="flex gap-1">
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-bounce`}
          style={{ animationDelay: '-0.2s' }}
        />
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-bounce`}
          style={{ animationDelay: '-0.05s' }}
        />
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-bounce`}
          style={{ animationDelay: '0.1s' }}
        />
      </span>
    </div>
  );
});
