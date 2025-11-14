import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { RetrospectiveTemplate } from '@/constants/retrospectiveTemplates';
import type { AiSummaryEntry } from '@/lib/tauri';

/**
 * Theme 관련 상태 슬라이스
 */
interface ThemeSlice {
  /**
   * 현재 테마 모드
   * - "light": 라이트 모드
   * - "dark": 다크 모드
   * - "system": 시스템 설정 따름
   */
  themeMode: 'light' | 'dark' | 'system';

  /**
   * 다크모드 활성화 여부 (계산된 값)
   * themeMode가 "system"일 때는 시스템 설정을 따름
   */
  isDarkMode: boolean;

  /**
   * 테마 모드 설정
   * @param mode - 설정할 테마 모드
   */
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;

  /**
   * 다크모드 상태 직접 설정 (시스템 테마 감지용)
   * @param isDark - 다크모드 여부
   */
  setIsDarkMode: (isDark: boolean) => void;

  /**
   * 테마 모드 전환 (light → dark → system → light)
   */
  toggleTheme: () => void;
}

/**
 * Markdown 관련 상태 슬라이스
 */
interface MarkdownSlice {
  /**
   * 현재 마크다운 내용
   */
  markdownContent: string;

  /**
   * 편집 모드 활성화 여부
   */
  isEditing: boolean;

  /**
   * 편집 중인 마크다운 내용
   */
  editingContent: string;

  /**
   * 저장 중 상태
   */
  isSaving: boolean;

  /**
   * 동기화 중 상태
   */
  isSyncing: boolean;

  /**
   * 마크다운 내용 설정
   * @param content - 마크다운 내용
   */
  setMarkdownContent: (content: string) => void;

  /**
   * 편집 모드 상태 변경
   * @param isEditing - 편집 모드 여부
   */
  setIsEditing: (isEditing: boolean) => void;

  /**
   * 편집 중인 내용 설정
   * @param content - 편집 중인 내용
   */
  setEditingContent: (content: string) => void;

  /**
   * 저장 중 상태 변경
   * @param isSaving - 저장 중 여부
   */
  setIsSaving: (isSaving: boolean) => void;

  /**
   * 동기화 중 상태 변경
   * @param isSyncing - 동기화 중 여부
   */
  setIsSyncing: (isSyncing: boolean) => void;
}

/**
 * AI 요약 관련 상태 슬라이스
 */
interface AiSlice {
  /**
   * AI 요약 목록
   */
  aiSummaries: AiSummaryEntry[];

  /**
   * 선택된 요약 인덱스
   */
  selectedSummaryIndex: number;

  /**
   * 요약 로딩 에러 메시지
   */
  summariesError: string | null;

  /**
   * AI 피드백 생성 중 상태
   */
  isGeneratingAiFeedback: boolean;

  /**
   * 스트리밍 중인 AI 텍스트
   */
  streamingAiText: string;

  /**
   * AI 패널 확장 상태
   */
  isAiPanelExpanded: boolean;

  /**
   * AI 요약 목록 설정
   * @param summaries - AI 요약 배열
   */
  setAiSummaries: (summaries: AiSummaryEntry[]) => void;

  /**
   * 선택된 요약 인덱스 설정
   * @param index - 선택할 인덱스
   */
  setSelectedSummaryIndex: (index: number) => void;

  /**
   * 요약 에러 설정
   * @param error - 에러 메시지 또는 null
   */
  setSummariesError: (error: string | null) => void;

  /**
   * AI 피드백 생성 중 상태 변경
   * @param isGenerating - 생성 중 여부
   */
  setIsGeneratingAiFeedback: (isGenerating: boolean) => void;

  /**
   * 스트리밍 AI 텍스트 설정
   * @param text - 스트리밍 텍스트
   */
  setStreamingAiText: (text: string) => void;

  /**
   * AI 패널 확장 상태 변경
   * @param isExpanded - 확장 여부 또는 상태 변경 함수
   */
  setIsAiPanelExpanded: (
    isExpanded: boolean | ((prev: boolean) => boolean)
  ) => void;
}

/**
 * Retrospect 관련 상태 슬라이스
 */
interface RetrospectSlice {
  /**
   * 회고 내용
   */
  retrospectContent: string;

  /**
   * 회고 저장 중 상태
   */
  isSavingRetrospect: boolean;

  /**
   * 템플릿 선택기 열림 상태
   */
  isTemplatePickerOpen: boolean;

  /**
   * 회고 뷰 모드 (편집/미리보기/분할)
   */
  retrospectViewMode: 'edit' | 'preview' | 'split';

  /**
   * 커스텀 회고 템플릿 목록
   */
  customRetrospectiveTemplates: RetrospectiveTemplate[];

  /**
   * 회고 패널 확장 상태
   */
  isRetrospectPanelExpanded: boolean;

  /**
   * 회고 내용 설정
   * @param content - 회고 내용
   */
  setRetrospectContent: (content: string) => void;

  /**
   * 회고 저장 중 상태 변경
   * @param isSaving - 저장 중 여부
   */
  setIsSavingRetrospect: (isSaving: boolean) => void;

  /**
   * 템플릿 선택기 열림 상태 변경
   * @param isOpen - 열림 여부
   */
  setIsTemplatePickerOpen: (isOpen: boolean) => void;

  /**
   * 회고 뷰 모드 설정
   * @param mode - 뷰 모드
   */
  setRetrospectViewMode: (mode: 'edit' | 'preview' | 'split') => void;

  /**
   * 커스텀 회고 템플릿 설정
   * @param templates - 템플릿 배열
   */
  setCustomRetrospectiveTemplates: (templates: RetrospectiveTemplate[]) => void;

  /**
   * 회고 패널 확장 상태 변경
   * @param isExpanded - 확장 여부 또는 상태 변경 함수
   */
  setIsRetrospectPanelExpanded: (
    isExpanded: boolean | ((prev: boolean) => boolean)
  ) => void;
}

/**
 * 전체 애플리케이션 상태
 */
export type AppStore = ThemeSlice & MarkdownSlice & AiSlice & RetrospectSlice;

/**
 * Zustand 스토어
 * - Theme: persist to localStorage
 * - Markdown: volatile (ephemeral state)
 * - AI: volatile
 * - Retrospect: persist retrospectContent only
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Theme Slice
      themeMode: 'system',
      isDarkMode: false,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setIsDarkMode: (isDark) => set({ isDarkMode: isDark }),
      toggleTheme: () =>
        set((state) => {
          const next =
            state.themeMode === 'light'
              ? 'dark'
              : state.themeMode === 'dark'
                ? 'system'
                : 'light';
          return { themeMode: next };
        }),

      // Markdown Slice
      markdownContent: '',
      isEditing: false,
      editingContent: '',
      isSaving: false,
      isSyncing: false,
      setMarkdownContent: (content) => set({ markdownContent: content }),
      setIsEditing: (isEditing) => set({ isEditing }),
      setEditingContent: (content) => set({ editingContent: content }),
      setIsSaving: (isSaving) => set({ isSaving }),
      setIsSyncing: (isSyncing) => set({ isSyncing }),

      // AI Slice
      aiSummaries: [],
      selectedSummaryIndex: 0,
      summariesError: null,
      isGeneratingAiFeedback: false,
      streamingAiText: '',
      isAiPanelExpanded: false,
      setAiSummaries: (summaries) => set({ aiSummaries: summaries }),
      setSelectedSummaryIndex: (index) => set({ selectedSummaryIndex: index }),
      setSummariesError: (error) => set({ summariesError: error }),
      setIsGeneratingAiFeedback: (isGenerating) =>
        set({ isGeneratingAiFeedback: isGenerating }),
      setStreamingAiText: (text) => set({ streamingAiText: text }),
      setIsAiPanelExpanded: (isExpanded) =>
        set((state) => ({
          isAiPanelExpanded:
            typeof isExpanded === 'function'
              ? isExpanded(state.isAiPanelExpanded)
              : isExpanded,
        })),

      // Retrospect Slice
      retrospectContent: '',
      isSavingRetrospect: false,
      isTemplatePickerOpen: false,
      retrospectViewMode: 'split',
      customRetrospectiveTemplates: [],
      isRetrospectPanelExpanded: false,
      setRetrospectContent: (content) => set({ retrospectContent: content }),
      setIsSavingRetrospect: (isSaving) =>
        set({ isSavingRetrospect: isSaving }),
      setIsTemplatePickerOpen: (isOpen) =>
        set({ isTemplatePickerOpen: isOpen }),
      setRetrospectViewMode: (mode) => set({ retrospectViewMode: mode }),
      setCustomRetrospectiveTemplates: (templates) =>
        set({ customRetrospectiveTemplates: templates }),
      setIsRetrospectPanelExpanded: (isExpanded) =>
        set((state) => ({
          isRetrospectPanelExpanded:
            typeof isExpanded === 'function'
              ? isExpanded(state.isRetrospectPanelExpanded)
              : isExpanded,
        })),
    }),
    {
      name: 'hoego-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist specific slices
      partialize: (state) => ({
        themeMode: state.themeMode,
        retrospectContent: state.retrospectContent,
        retrospectViewMode: state.retrospectViewMode,
        customRetrospectiveTemplates: state.customRetrospectiveTemplates,
      }),
    }
  )
);
