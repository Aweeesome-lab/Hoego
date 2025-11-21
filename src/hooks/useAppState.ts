import { useState } from 'react';

/**
 * App.tsx의 로컬 상태를 관리하는 커스텀 훅
 *
 * @returns App의 모든 로컬 상태와 setter 함수들
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     inputValue, setInputValue,
 *     isSyncing, setIsSyncing,
 *     // ...
 *   } = useAppState();
 * }
 * ```
 */
export function useAppState() {
  const [inputValue, setInputValue] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFeedbackPanelExpanded, setIsFeedbackPanelExpanded] = useState(false);
  const [isRetrospectPanelExpanded, setIsRetrospectPanelExpanded] =
    useState(false);
  const [currentHistoryDate, setCurrentHistoryDate] = useState<string | null>(
    null
  );
  const [isLoadingHistoryContent, setIsLoadingHistoryContent] = useState(false);

  return {
    inputValue,
    setInputValue,
    isSyncing,
    setIsSyncing,
    isFeedbackPanelExpanded,
    setIsFeedbackPanelExpanded,
    isRetrospectPanelExpanded,
    setIsRetrospectPanelExpanded,
    currentHistoryDate,
    setCurrentHistoryDate,
    isLoadingHistoryContent,
    setIsLoadingHistoryContent,
  };
}
