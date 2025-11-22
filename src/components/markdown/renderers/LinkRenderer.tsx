import { ExternalLink } from 'lucide-react';
import React, { useState } from 'react';

import { LinkPreviewCard } from '../LinkPreviewCard';

import type { LinkRendererProps } from '../types';

/**
 * 링크 렌더러
 *
 * - 외부 링크: LinkPreviewCard로 프리뷰 표시
 * - 내부 링크/앵커: 일반 링크로 표시
 *
 * @param children - 링크 텍스트
 * @param href - 링크 URL
 * @param isDarkMode - 다크모드 여부
 */
export const LinkRenderer = React.memo(function LinkRenderer({
  children,
  href,
  isDarkMode,
  ...props
}: LinkRendererProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const [showPreview, setShowPreview] = useState(false);

  if (!href) {
    return <span>{children}</span>;
  }

  // URL 타입 판별
  const isExternal = /^https?:\/\//.test(href);

  // 외부 링크: LinkPreviewCard 사용
  if (isExternal) {
    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        role="button"
        tabIndex={0}
      >
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 underline decoration-emerald-400 underline-offset-2 transition-colors ${
            isDarkMode
              ? 'text-emerald-300 hover:text-emerald-200'
              : 'text-emerald-600 hover:text-emerald-700'
          }`}
        >
          {children}
          <ExternalLink className="h-3 w-3" />
        </a>
        {showPreview && (
          <div className="absolute left-0 top-full z-50 mt-2">
            <LinkPreviewCard href={href} isDarkMode={isDarkMode} />
          </div>
        )}
      </div>
    );
  }

  // 내부 링크/앵커
  return (
    <a
      {...props}
      href={href}
      className={`underline decoration-emerald-400 underline-offset-2 transition-colors ${
        isDarkMode
          ? 'text-emerald-300 hover:text-emerald-200'
          : 'text-emerald-600 hover:text-emerald-700'
      }`}
    >
      {children}
    </a>
  );
});

/**
 * 이미지 렌더러
 */
export const ImageRenderer = React.memo(function ImageRenderer({
  isDarkMode,
  ...props
}: Pick<LinkRendererProps, 'isDarkMode'> &
  React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      className={`my-4 max-w-full rounded-lg ${
        isDarkMode ? 'border border-slate-700' : 'border border-slate-200'
      }`}
      loading="lazy"
      alt={props.alt || ''}
    />
  );
});
