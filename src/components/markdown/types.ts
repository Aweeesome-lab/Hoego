/**
 * Markdown 렌더러 타입 정의
 *
 * 표준 prose 스타일을 기본으로 사용하며,
 * 특수 기능이 필요한 컴포넌트만 타입 정의
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
// 공통 Props
// ============================================================================

export interface BaseComponentProps {
  children?: React.ReactNode;
  node?: any;
  isDarkMode?: boolean;
}

// ============================================================================
// Code (syntax highlighting)
// ============================================================================

export interface CodeProps extends BaseComponentProps {
  inline?: boolean;
  className?: string;
}

// ============================================================================
// Mermaid 다이어그램
// ============================================================================

export interface MermaidProps {
  chart: string;
  isDarkMode?: boolean;
}

// ============================================================================
// React-Markdown 컴포넌트 매핑 타입
// ============================================================================

export type MarkdownComponents = Components;
