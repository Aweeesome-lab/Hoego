import React from 'react';

interface TextRendererProps {
  children: React.ReactNode;
  isDarkMode: boolean;
}

/**
 * 문단 렌더러
 */
export function ParagraphRenderer({
  children,
  ...props
}: TextRendererProps & React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className="mb-3 text-[13px] leading-relaxed break-words">
      {children}
    </p>
  );
}

/**
 * 강조 (굵게) 렌더러
 */
export function StrongRenderer({
  children,
  isDarkMode,
  ...props
}: TextRendererProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <strong
      {...props}
      className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
    >
      {children}
    </strong>
  );
}

/**
 * 기울임 렌더러
 */
export function EmRenderer({
  children,
  ...props
}: Omit<TextRendererProps, 'isDarkMode'> & React.HTMLAttributes<HTMLElement>) {
  return (
    <em {...props} className="italic">
      {children}
    </em>
  );
}

/**
 * 취소선 렌더러
 */
export function DelRenderer({
  children,
  ...props
}: Omit<TextRendererProps, 'isDarkMode'> & React.HTMLAttributes<HTMLElement>) {
  return (
    <del className="text-slate-400 line-through decoration-2" {...props}>
      {children}
    </del>
  );
}

/**
 * 수평선 렌더러
 */
export function HrRenderer({
  isDarkMode,
  ...props
}: Pick<TextRendererProps, 'isDarkMode'> &
  React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      {...props}
      className={`my-6 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
    />
  );
}
