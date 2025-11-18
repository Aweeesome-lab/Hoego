import { cn } from '@/lib/utils';
import { ReactNode, HTMLAttributes } from 'react';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Display Large - 가장 큰 제목 (3rem)
 * @example
 * <DisplayLarge>Welcome to Hoego</DisplayLarge>
 */
export const DisplayLarge = ({
  children,
  className,
  ...props
}: TypographyProps) => (
  <h1 className={cn('text-display-lg text-foreground', className)} {...props}>
    {children}
  </h1>
);

/**
 * Display - 큰 제목 (2.25rem)
 * @example
 * <Display>Features</Display>
 */
export const Display = ({ children, className, ...props }: TypographyProps) => (
  <h1 className={cn('text-display text-foreground', className)} {...props}>
    {children}
  </h1>
);

/**
 * H1 - 페이지 제목 (2rem)
 * @example
 * <H1>Dashboard</H1>
 */
export const H1 = ({ children, className, ...props }: TypographyProps) => (
  <h1 className={cn('text-h1 text-foreground', className)} {...props}>
    {children}
  </h1>
);

/**
 * H2 - 섹션 제목 (1.5rem)
 * @example
 * <H2>Recent Activity</H2>
 */
export const H2 = ({ children, className, ...props }: TypographyProps) => (
  <h2 className={cn('text-h2 text-foreground', className)} {...props}>
    {children}
  </h2>
);

/**
 * H3 - 서브 섹션 제목 (1.25rem)
 * @example
 * <H3>Settings</H3>
 */
export const H3 = ({ children, className, ...props }: TypographyProps) => (
  <h3 className={cn('text-h3 text-foreground', className)} {...props}>
    {children}
  </h3>
);

/**
 * H4 - 작은 제목 (1.125rem)
 * @example
 * <H4>Options</H4>
 */
export const H4 = ({ children, className, ...props }: TypographyProps) => (
  <h4 className={cn('text-h4 text-foreground', className)} {...props}>
    {children}
  </h4>
);

/**
 * Body Large - 큰 본문 텍스트 (1.125rem)
 * @example
 * <BodyLarge>This is a large body text.</BodyLarge>
 */
export const BodyLarge = ({
  children,
  className,
  ...props
}: TypographyProps) => (
  <p className={cn('text-body-lg text-foreground', className)} {...props}>
    {children}
  </p>
);

/**
 * Body - 기본 본문 텍스트 (1rem)
 * @example
 * <Body>This is a regular body text.</Body>
 */
export const Body = ({ children, className, ...props }: TypographyProps) => (
  <p className={cn('text-body text-foreground', className)} {...props}>
    {children}
  </p>
);

/**
 * Body Small - 작은 본문 텍스트 (0.875rem)
 * @example
 * <BodySmall>This is a small body text.</BodySmall>
 */
export const BodySmall = ({
  children,
  className,
  ...props
}: TypographyProps) => (
  <p className={cn('text-body-sm text-foreground', className)} {...props}>
    {children}
  </p>
);

/**
 * Caption - 캡션/설명 텍스트 (0.75rem)
 * @example
 * <Caption>Last updated 2 hours ago</Caption>
 */
export const Caption = ({ children, className, ...props }: TypographyProps) => (
  <span
    className={cn('text-caption text-muted-foreground', className)}
    {...props}
  >
    {children}
  </span>
);

/**
 * Caption Small - 매우 작은 캡션 (0.6875rem)
 * @example
 * <CaptionSmall>© 2024</CaptionSmall>
 */
export const CaptionSmall = ({
  children,
  className,
  ...props
}: TypographyProps) => (
  <span
    className={cn('text-caption-sm text-muted-foreground', className)}
    {...props}
  >
    {children}
  </span>
);

/**
 * Code - 인라인 코드 (monospace)
 * @example
 * <Code>const x = 10;</Code>
 */
export const Code = ({ children, className, ...props }: TypographyProps) => (
  <code
    className={cn(
      'font-mono text-body-sm bg-muted text-foreground px-1.5 py-0.5 rounded',
      className
    )}
    {...props}
  >
    {children}
  </code>
);

/**
 * Lead - 리드 텍스트 (강조된 큰 본문)
 * @example
 * <Lead>This is an important introductory paragraph.</Lead>
 */
export const Lead = ({ children, className, ...props }: TypographyProps) => (
  <p className={cn('text-body-lg text-muted-foreground', className)} {...props}>
    {children}
  </p>
);

/**
 * Muted - 흐린 텍스트
 * @example
 * <Muted>This is less important text.</Muted>
 */
export const Muted = ({ children, className, ...props }: TypographyProps) => (
  <p className={cn('text-body-sm text-muted-foreground', className)} {...props}>
    {children}
  </p>
);

/**
 * Blockquote - 인용문
 * @example
 * <Blockquote>This is a quote.</Blockquote>
 */
export const Blockquote = ({
  children,
  className,
  ...props
}: TypographyProps) => (
  <blockquote
    className={cn(
      'border-l-4 border-primary pl-4 italic text-foreground',
      className
    )}
    {...props}
  >
    {children}
  </blockquote>
);
