import { useRef, useEffect } from 'react';

import { getRetrospectMarkdown, saveRetrospectMarkdown } from '@/lib/tauri';
import { useAppStore } from '@/store';

interface UseRetrospectOptions {
  currentHistoryDate: string | null;
}

export function useRetrospect({ currentHistoryDate }: UseRetrospectOptions) {
  // Zustand store selectors
  const retrospectContent = useAppStore((state) => state.retrospectContent);
  const isSavingRetrospect = useAppStore((state) => state.isSavingRetrospect);

  const setRetrospectContent = useAppStore(
    (state) => state.setRetrospectContent
  );
  const setIsSavingRetrospect = useAppStore(
    (state) => state.setIsSavingRetrospect
  );

  // Refs
  const retrospectDebounceIdRef = useRef<number | null>(null);

  // 날짜 변경 시 해당 날짜의 회고 로드
  useEffect(() => {
    if (!currentHistoryDate) {
      // 날짜가 선택되지 않으면 빈 내용
      setRetrospectContent('');
      return;
    }

    void (async () => {
      try {
        const content = await getRetrospectMarkdown(currentHistoryDate);
        setRetrospectContent(content);
      } catch (error) {
        console.error('Failed to load retrospect:', error);
        setRetrospectContent('');
      }
    })();
  }, [currentHistoryDate, setRetrospectContent]);

  // 회고 내용 자동 저장 (디바운스)
  useEffect(() => {
    // 날짜가 선택되지 않으면 저장하지 않음
    if (!currentHistoryDate) return;

    if (retrospectDebounceIdRef.current) {
      clearTimeout(retrospectDebounceIdRef.current);
    }

    retrospectDebounceIdRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          setIsSavingRetrospect(true);
          await saveRetrospectMarkdown(currentHistoryDate, retrospectContent);
          setTimeout(() => setIsSavingRetrospect(false), 500);
        } catch (error) {
          console.error('Failed to save retrospect content:', error);
          setIsSavingRetrospect(false);
        }
      })();
    }, 800);

    return () => {
      if (retrospectDebounceIdRef.current) {
        clearTimeout(retrospectDebounceIdRef.current);
      }
    };
  }, [currentHistoryDate, retrospectContent, setIsSavingRetrospect]);

  return {
    retrospectContent,
    setRetrospectContent,
    isSavingRetrospect,
  };
}
