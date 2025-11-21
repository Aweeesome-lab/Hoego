import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface BlockquoteRendererProps {
  children: React.ReactNode;
  isDarkMode: boolean;
}

/**
 * Blockquote 렌더러
 *
 * GitHub 스타일 callout 지원:
 * - [!NOTE] - 정보
 * - [!TIP] - 팁
 * - [!WARNING] - 경고
 * - [!IMPORTANT] - 중요
 */
export function BlockquoteRenderer({
  children,
  isDarkMode,
  ...props
}: BlockquoteRendererProps & React.HTMLAttributes<HTMLQuoteElement>) {
  // Callout 타입 감지
  const childText = React.Children.toArray(children)
    .map((child) => {
      if (React.isValidElement(child)) {
        return child.props?.children;
      }
      return child;
    })
    .join('');

  const calloutMatch = String(childText).match(
    /^\[!(NOTE|TIP|WARNING|IMPORTANT)\]/i
  );
  const calloutType = calloutMatch?.[1]?.toUpperCase();

  // Callout 스타일 설정
  const calloutStyles = {
    NOTE: {
      icon: Info,
      border: isDarkMode ? 'border-blue-500' : 'border-blue-400',
      bg: isDarkMode ? 'bg-blue-950/30' : 'bg-blue-50',
      iconColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      title: isDarkMode ? 'text-blue-300' : 'text-blue-700',
    },
    TIP: {
      icon: CheckCircle,
      border: isDarkMode ? 'border-green-500' : 'border-green-400',
      bg: isDarkMode ? 'bg-green-950/30' : 'bg-green-50',
      iconColor: isDarkMode ? 'text-green-400' : 'text-green-600',
      title: isDarkMode ? 'text-green-300' : 'text-green-700',
    },
    WARNING: {
      icon: AlertTriangle,
      border: isDarkMode ? 'border-yellow-500' : 'border-yellow-400',
      bg: isDarkMode ? 'bg-yellow-950/30' : 'bg-yellow-50',
      iconColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
      title: isDarkMode ? 'text-yellow-300' : 'text-yellow-700',
    },
    IMPORTANT: {
      icon: AlertCircle,
      border: isDarkMode ? 'border-red-500' : 'border-red-400',
      bg: isDarkMode ? 'bg-red-950/30' : 'bg-red-50',
      iconColor: isDarkMode ? 'text-red-400' : 'text-red-600',
      title: isDarkMode ? 'text-red-300' : 'text-red-700',
    },
  };

  if (calloutType && calloutStyles[calloutType as keyof typeof calloutStyles]) {
    const style = calloutStyles[calloutType as keyof typeof calloutStyles];
    const Icon = style.icon;

    return (
      <div
        className={`my-4 rounded-lg border-l-4 ${style.border} ${style.bg} p-4`}
      >
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${style.iconColor}`} />
          <div className="flex-1">
            <div className={`mb-1 font-semibold text-sm ${style.title}`}>
              {calloutType}
            </div>
            <div className="text-[13px] leading-relaxed">
              {/* Callout 타입 제거한 내용 렌더링 */}
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  const newChildren = String(
                    child.props?.children || ''
                  ).replace(/^\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i, '');
                  return React.cloneElement(child, {
                    ...child.props,
                    children: newChildren,
                  });
                }
                return child;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 일반 blockquote
  return (
    <blockquote
      {...props}
      className={`my-4 border-l-4 pl-4 italic ${
        isDarkMode
          ? 'border-slate-600 text-slate-400'
          : 'border-slate-300 text-slate-600'
      }`}
    >
      {children}
    </blockquote>
  );
}
