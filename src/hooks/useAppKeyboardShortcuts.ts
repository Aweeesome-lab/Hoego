import { useEffect } from 'react';

import { hideOverlayWindow } from '@/lib/tauri';

interface UseAppKeyboardShortcutsOptions {
  toggleSidebar: () => void;
  setIsFeedbackPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRetrospectPanelExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * App의 키보드 단축키를 처리하는 커스텀 훅
 *
 * @param options - 단축키 핸들러에 필요한 상태와 함수들
 *
 * @example
 * ```tsx
 * useAppKeyboardShortcuts({
 *   toggleSidebar,
 *   setIsFeedbackPanelExpanded,
 *   setIsRetrospectPanelExpanded,
 * });
 * ```
 */
export function useAppKeyboardShortcuts({
  toggleSidebar,
  setIsFeedbackPanelExpanded,
  setIsRetrospectPanelExpanded,
}: UseAppKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      // 사이드바 토글: Cmd/Ctrl + 1
      if ((event.metaKey || event.ctrlKey) && event.key === '1') {
        event.preventDefault();
        event.stopPropagation();
        toggleSidebar();
        return;
      }

      // 패널 토글: Cmd/Ctrl + 2 for AI panel
      if ((event.metaKey || event.ctrlKey) && event.key === '2') {
        event.preventDefault();
        event.stopPropagation();
        setIsFeedbackPanelExpanded((prev) => !prev);
        return;
      }

      // 패널 토글: Cmd/Ctrl + 3 for Retrospect panel
      if ((event.metaKey || event.ctrlKey) && event.key === '3') {
        event.preventDefault();
        event.stopPropagation();
        setIsRetrospectPanelExpanded((prev) => !prev);
        return;
      }

      // ESC: 창 숨김
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        void hideOverlayWindow();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleSidebar, setIsFeedbackPanelExpanded, setIsRetrospectPanelExpanded]);
}
