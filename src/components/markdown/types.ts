/**
 * Markdown 렌더러 타입 정의
 */

import type { Components } from 'react-markdown';

// ============================================================================
// 기본 타입
// ============================================================================

export interface MarkdownViewerProps {
  content: string;
  className?: string;
  isDarkMode?: boolean;
  onContentChange?: (content: string) => void;
}

// ============================================================================
// 체크박스 관련 타입
// ============================================================================

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface TaskListItemProps {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isDarkMode?: boolean;
  disabled?: boolean;
}

export interface TaskToggleResult {
  success: boolean;
  newContent: string;
  error?: string;
}

// ============================================================================
// 컴포넌트 Props 타입
// ============================================================================

export interface BaseComponentProps {
  children?: React.ReactNode;
  node?: any;
  isDarkMode?: boolean;
}

export interface HeadingProps extends BaseComponentProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface CodeProps extends BaseComponentProps {
  inline?: boolean;
  className?: string;
}

export interface LinkProps extends BaseComponentProps {
  href?: string;
  title?: string;
}

export interface ImageProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  title?: string;
}

export interface ListProps extends BaseComponentProps {
  ordered?: boolean;
  start?: number;
}

export interface ListItemProps extends BaseComponentProps {
  checked?: boolean | null;
  index?: number;
}

export interface TableProps extends BaseComponentProps {
  align?: ('left' | 'right' | 'center' | null)[];
}

// ============================================================================
// React-Markdown 컴포넌트 매핑 타입
// ============================================================================

export type MarkdownComponents = Components;

// ============================================================================
// Mermaid 다이어그램 타입
// ============================================================================

export interface MermaidProps {
  chart: string;
  isDarkMode?: boolean;
}
