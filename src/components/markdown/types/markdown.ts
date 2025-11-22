import type { Position } from 'unist';

/**
 * Task list item data from mdast
 */
export interface TaskListItem {
  checked: boolean | null;
  position?: Position | null;
}

/**
 * 마크다운 렌더러 Props
 */
export interface MarkdownRendererProps {
  /** 렌더링할 마크다운 콘텐츠 */
  content: string;
  /** 다크모드 여부 */
  isDarkMode?: boolean;
  /** Task list 체크박스 토글 핸들러 */
  onTaskToggle?: (position: Position, checked: boolean) => Promise<void>;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 저장 중 상태 */
  isSaving?: boolean;
}

/**
 * 마크다운 프리뷰 Props (읽기 전용)
 */
export interface MarkdownPreviewProps extends MarkdownRendererProps {
  /** 프리뷰 컨테이너 ref */
  previewRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Task list 렌더러 Props
 */
export interface TaskListItemProps {
  /** 체크 상태 */
  checked: boolean;
  /** 토글 핸들러 */
  onToggle: () => Promise<void>;
  /** 자식 노드 */
  children: React.ReactNode;
  /** 다크모드 여부 */
  isDarkMode: boolean;
  /** 비활성화 여부 (저장 중 등) */
  disabled: boolean;
}

/**
 * 헤딩 렌더러 Props
 */
export interface HeadingRendererProps {
  /** 헤딩 레벨 (1-6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** 자식 노드 */
  children: React.ReactNode;
  /** 다크모드 여부 */
  isDarkMode: boolean;
}

/**
 * 코드 렌더러 Props
 */
export interface CodeRendererProps {
  /** 코드 내용 */
  children: string;
  /** 언어 (옵션) */
  language?: string;
  /** 인라인 코드 여부 */
  inline?: boolean;
  /** 다크모드 여부 */
  isDarkMode: boolean;
}

/**
 * 텍스트 렌더러 Props (p, strong, em, del, hr 등)
 */
export interface TextRendererProps {
  /** 자식 노드 (hr은 제외) */
  children?: React.ReactNode;
  /** 다크모드 여부 */
  isDarkMode?: boolean;
}

/**
 *  테이블 렌더러 Props
 */
export interface TableRendererProps {
  /** 자식 노드 */
  children: React.ReactNode;
  /** 다크모드 여부 */
  isDarkMode?: boolean;
}

/**
 * 링크 렌더러 Props
 */
export interface LinkRendererProps {
  /** 자식 노드 */
  children: React.ReactNode;
  /** 링크 URL */
  href?: string;
  /** 다크모드 여부 */
  isDarkMode: boolean;
}
