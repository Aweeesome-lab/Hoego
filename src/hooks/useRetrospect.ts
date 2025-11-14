import { useState, useRef, useCallback, useEffect } from "react";
import {
  RETROSPECTIVE_TEMPLATES,
  CUSTOM_RETROSPECTIVE_STORAGE_KEY,
  type RetrospectiveTemplate,
} from "@/constants/retrospectiveTemplates";

const TEMPLATE_DROPDOWN_WIDTH = 360;

export function useRetrospect() {
  const [retrospectContent, setRetrospectContent] = useState(() => {
    return localStorage.getItem("hoego.retrospectContent") || "";
  });
  const retrospectRef = useRef<HTMLTextAreaElement | null>(null);
  const [isSavingRetrospect, setIsSavingRetrospect] = useState(false);
  const retrospectDebounceIdRef = useRef<number | null>(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const templateDropdownRef = useRef<HTMLDivElement | null>(null);
  const templateTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [templateDropdownPosition, setTemplateDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: TEMPLATE_DROPDOWN_WIDTH,
  });
  const [retrospectViewMode, setRetrospectViewMode] = useState<
    "edit" | "preview" | "split"
  >("split");
  const [customRetrospectiveTemplates, setCustomRetrospectiveTemplates] =
    useState<RetrospectiveTemplate[]>(() => {
      try {
        const stored = localStorage.getItem(CUSTOM_RETROSPECTIVE_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item?.id === "string");
        }
        return [];
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("[hoego] 커스텀 회고 템플릿 파싱 실패", error);
        }
        return [];
      }
    });

  const updateTemplateDropdownPosition = useCallback(() => {
    const trigger = templateTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const padding = 12;
    const width = TEMPLATE_DROPDOWN_WIDTH;
    let left = rect.right - width;
    if (left < padding) {
      left = padding;
    }
    const maxLeft = window.innerWidth - width - padding;
    if (left > maxLeft) {
      left = maxLeft;
    }
    const top = Math.min(
      window.innerHeight - padding - 24,
      rect.bottom + 8
    );
    setTemplateDropdownPosition({
      top,
      left,
      width,
    });
  }, []);

  const handleApplyRetrospectiveTemplate = useCallback(
    (templateId: string) => {
      const template = [
        ...RETROSPECTIVE_TEMPLATES,
        ...customRetrospectiveTemplates,
      ].find((item) => item.id === templateId);
      if (!template) return;

      const textarea = retrospectRef.current;
      const templateBlock = `${template.markdown.trim()}\n\n`;
      const selectionStart =
        textarea && typeof textarea.selectionStart === "number"
          ? textarea.selectionStart
          : null;
      const selectionEnd =
        textarea && typeof textarea.selectionEnd === "number"
          ? textarea.selectionEnd
          : null;

      let nextCursor = 0;
      setRetrospectContent((prev) => {
        const start = selectionStart ?? prev.length;
        const end = selectionEnd ?? start;
        const before = prev.slice(0, start);
        const after = prev.slice(end);

        let paddedBefore = before;
        if (paddedBefore.length) {
          if (paddedBefore.endsWith("\n\n")) {
            // already has blank line
          } else if (paddedBefore.endsWith("\n")) {
            // single newline is fine
          } else {
            paddedBefore += "\n\n";
          }
        }

        const next = paddedBefore + templateBlock + after;
        nextCursor = paddedBefore.length + templateBlock.length;
        return next;
      });

      setIsTemplatePickerOpen(false);

      requestAnimationFrame(() => {
        const textareaEl = retrospectRef.current;
        if (textareaEl) {
          textareaEl.focus();
          textareaEl.setSelectionRange(nextCursor, nextCursor);
        }
      });
    },
    [customRetrospectiveTemplates]
  );

  // 회고 내용 자동 저장 (디바운스)
  useEffect(() => {
    if (retrospectDebounceIdRef.current) {
      clearTimeout(retrospectDebounceIdRef.current);
    }

    retrospectDebounceIdRef.current = window.setTimeout(() => {
      try {
        setIsSavingRetrospect(true);
        localStorage.setItem("hoego.retrospectContent", retrospectContent);
        setTimeout(() => setIsSavingRetrospect(false), 500);
      } catch (error) {
        console.error("Failed to save retrospect content:", error);
        setIsSavingRetrospect(false);
      }
    }, 800);

    return () => {
      if (retrospectDebounceIdRef.current) {
        clearTimeout(retrospectDebounceIdRef.current);
      }
    };
  }, [retrospectContent]);

  useEffect(() => {
    if (!isTemplatePickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const dropdown = templateDropdownRef.current;
      const trigger = templateTriggerRef.current;

      if (!target) return;
      if (dropdown?.contains(target)) return;
      if (trigger?.contains(target)) return;
      setIsTemplatePickerOpen(false);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTemplatePickerOpen(false);
      }
    };

    const handleReposition = () => {
      updateTemplateDropdownPosition();
    };

    updateTemplateDropdownPosition();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isTemplatePickerOpen, updateTemplateDropdownPosition]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === CUSTOM_RETROSPECTIVE_STORAGE_KEY) {
        try {
          const parsed = event.newValue ? JSON.parse(event.newValue) : [];
          if (Array.isArray(parsed)) {
            setCustomRetrospectiveTemplates(
              parsed.filter((item: RetrospectiveTemplate) => typeof item?.id === "string")
            );
          } else {
            setCustomRetrospectiveTemplates([]);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn("[hoego] 커스텀 템플릿 동기화 실패", error);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const retrospectiveTemplates = [
    ...RETROSPECTIVE_TEMPLATES,
    ...customRetrospectiveTemplates,
  ];

  return {
    retrospectContent,
    setRetrospectContent,
    retrospectRef,
    isSavingRetrospect,
    isTemplatePickerOpen,
    setIsTemplatePickerOpen,
    templateDropdownRef,
    templateTriggerRef,
    templateDropdownPosition,
    retrospectViewMode,
    setRetrospectViewMode,
    retrospectiveTemplates,
    customRetrospectiveTemplates,
    handleApplyRetrospectiveTemplate,
  };
}
