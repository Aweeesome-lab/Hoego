import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { RetrospectiveTemplate } from '@/constants/retrospectiveTemplates';
import type { AiSummaryEntry } from '@/lib/tauri';
import type {
  WeekData,
  WeeklyActionItem,
} from '@/types/tauri-commands';

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

export type PipelineStage = 'idle' | 'analyzing' | 'done' | 'error';

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
   * AI 파이프라인 단계
   */
  pipelineStage: PipelineStage;

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
   * AI 파이프라인 단계 설정
   * @param stage - 파이프라인 단계
   */
  setPipelineStage: (stage: PipelineStage) => void;

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
 * Weekly Dashboard 관련 상태 슬라이스
 */
interface WeeklyDashboardSlice {
  /**
   * 주 시작 요일 ('sunday' | 'monday')
   */
  weekStartDay: 'sunday' | 'monday';

  /**
   * 현재 주의 시작 날짜 (ISO 8601 format)
   */
  currentWeekStart: string;

  /**
   * 주간 데이터
   */
  weekData: WeekData | null;

  /**
   * 주간 데이터 로딩 중 상태
   */
  isLoadingWeekData: boolean;

  /**
   * 주간 데이터 로딩 에러
   */
  weekDataError: string | null;

  /**
   * AI 주간 종합 리포트
   */
  weeklySummary: string;

  /**
   * 주간 리포트 생성 중 상태
   */
  isGeneratingSummary: boolean;

  /**
   * 스트리밍 중인 주간 리포트 텍스트
   */
  streamingSummaryText: string;

  /**
   * 주간 액션 아이템 목록
   */
  actionItems: WeeklyActionItem[];

  /**
   * 액션 아이템 저장 중 상태
   */
  isSavingActions: boolean;

  /**
   * 주 시작 요일 설정
   * @param day - 주 시작 요일
   */
  setWeekStartDay: (day: 'sunday' | 'monday') => void;

  /**
   * 현재 주 시작 날짜 설정
   * @param date - ISO 8601 형식의 날짜
   */
  setCurrentWeekStart: (date: string) => void;

  /**
   * 주간 데이터 설정
   * @param data - 주간 데이터
   */
  setWeekData: (data: WeekData | null) => void;

  /**
   * 주간 데이터 로딩 상태 변경
   * @param isLoading - 로딩 중 여부
   */
  setIsLoadingWeekData: (isLoading: boolean) => void;

  /**
   * 주간 데이터 에러 설정
   * @param error - 에러 메시지 또는 null
   */
  setWeekDataError: (error: string | null) => void;

  /**
   * 주간 리포트 설정
   * @param summary - 주간 리포트 내용
   */
  setWeeklySummary: (summary: string) => void;

  /**
   * 주간 리포트 생성 상태 변경
   * @param isGenerating - 생성 중 여부
   */
  setIsGeneratingSummary: (isGenerating: boolean) => void;

  /**
   * 스트리밍 주간 리포트 텍스트 설정
   * @param text - 스트리밍 텍스트
   */
  setStreamingSummaryText: (text: string) => void;

  /**
   * 액션 아이템 목록 설정
   * @param actions - 액션 아이템 배열
   */
  setActionItems: (actions: WeeklyActionItem[]) => void;

  /**
   * 액션 아이템 저장 상태 변경
   * @param isSaving - 저장 중 여부
   */
  setIsSavingActions: (isSaving: boolean) => void;
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
export type AppStore = ThemeSlice &
  MarkdownSlice &
  AiSlice &
  RetrospectSlice &
  WeeklyDashboardSlice;

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
      pipelineStage: 'idle',
      streamingAiText: '',
      isAiPanelExpanded: false,
      setAiSummaries: (summaries) => set({ aiSummaries: summaries }),
      setSelectedSummaryIndex: (index) => set({ selectedSummaryIndex: index }),
      setSummariesError: (error) => set({ summariesError: error }),
      setIsGeneratingAiFeedback: (isGenerating) =>
        set({ isGeneratingAiFeedback: isGenerating }),
      setPipelineStage: (stage) => set({ pipelineStage: stage }),
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

      // Weekly Dashboard Slice
      weekStartDay: 'monday',
      currentWeekStart: (() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        const isoParts = monday.toISOString().split('T');
        return isoParts[0] as string;
      })(),
      weekData: null,
      isLoadingWeekData: false,
      weekDataError: null,
      weeklySummary: '',
      isGeneratingSummary: false,
      streamingSummaryText: '',
      actionItems: [],
      isSavingActions: false,
      setWeekStartDay: (day) => set({ weekStartDay: day }),
      setCurrentWeekStart: (date) => set({ currentWeekStart: date }),
      setWeekData: (data) => set({ weekData: data }),
      setIsLoadingWeekData: (isLoading) =>
        set({ isLoadingWeekData: isLoading }),
      setWeekDataError: (error) => set({ weekDataError: error }),
      setWeeklySummary: (summary) => set({ weeklySummary: summary }),
      setIsGeneratingSummary: (isGenerating) =>
        set({ isGeneratingSummary: isGenerating }),
      setStreamingSummaryText: (text) => set({ streamingSummaryText: text }),
      setActionItems: (actions) => set({ actionItems: actions }),
      setIsSavingActions: (isSaving) => set({ isSavingActions: isSaving }),
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
        weekStartDay: state.weekStartDay,
        currentWeekStart: state.currentWeekStart,
      }),
    }
  )
);
