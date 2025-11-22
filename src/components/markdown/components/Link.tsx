/**
 * Link 컴포넌트 (a, img)
 */

import type { ImageProps, LinkProps } from '../types';

/**
 * 링크 렌더러
 */
export function Link({ href, children, isDarkMode }: LinkProps) {
  const isExternal = href?.startsWith('http');

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`
        underline underline-offset-2
        transition-colors
        ${isDarkMode
          ? 'text-blue-400 hover:text-blue-300'
          : 'text-blue-600 hover:text-blue-700'
        }
      `}
    >
      {children}
    </a>
  );
}

/**
 * 이미지 렌더러
 */
export function Img({ src, alt, title }: ImageProps) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt || ''}
      title={title}
      className="max-w-full h-auto rounded-lg my-4"
      loading="lazy"
    />
  );
}
