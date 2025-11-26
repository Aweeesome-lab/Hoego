import { Pencil, Eye } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';

import { MarkdownViewer } from '@/components/markdown';
import { Button, Badge } from '@/components/ui';
import { useAppStore } from '@/store';
import { useDocumentStore } from '@/store/documentStore';

interface DumpPanelProps {
  isDarkMode: boolean;
  dumpContent: string;
  markdownRef: React.RefObject<HTMLDivElement>;
  editorRef: React.RefObject<HTMLTextAreaElement>;
  currentDateLabel?: string;
  isSaving: boolean;
}

export const DumpPanel = React.memo(function DumpPanel({
  isDarkMode,
  dumpContent,
  markdownRef,
  editorRef,
  currentDateLabel,
  isSaving,
}: DumpPanelProps) {
  const isEditing = useAppStore((state) => state.isEditing);
  const editingContent = useAppStore((state) => state.editingContent);
  const setIsEditing = useAppStore((state) => state.setIsEditing);
  const setEditingContent = useAppStore((state) => state.setEditingContent);
  const setMarkdownContent = useAppStore((state) => state.setMarkdownContent);
  const setIsSaving = useAppStore((state) => state.setIsSaving);

  const handleToggleEdit = React.useCallback(() => {
    if (!isEditing) {
      // Entering edit mode
      setEditingContent(dumpContent);
      setIsEditing(true);
    } else {
      // Exiting edit mode - save the content first
      void (async () => {
        try {
          setIsSaving(true);
          const { saveActiveDocument } = useDocumentStore.getState();
          const saveResult = await saveActiveDocument(editingContent);

          if (!saveResult.success) {
            throw new Error(saveResult.error || 'Save failed');
          }

          // Update markdown content on success
          setMarkdownContent(editingContent);
          setIsEditing(false);

          // Update markdown content on success
          setMarkdownContent(editingContent);
          setIsEditing(false);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[DumpPanel] 편집 내용 저장 실패:', error);
          }
          toast.error(
            `저장 실패: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        } finally {
          setIsSaving(false);
        }
      })();
    }
  }, [
    isEditing,
    dumpContent,
    editingContent,
    setIsEditing,
    setEditingContent,
    setMarkdownContent,
    setIsSaving,
  ]);

  const handleEditorChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditingContent(e.target.value);
    },
    [setEditingContent]
  );

  // ESC key handler to exit edit mode (with save)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        event.preventDefault();

        // Save before exiting
        void (async () => {
          try {
            setIsSaving(true);
            const { saveActiveDocument } = useDocumentStore.getState();
            const saveResult = await saveActiveDocument(editingContent);

            if (!saveResult.success) {
              throw new Error(saveResult.error || 'Save failed');
            }

            // Update markdown content on success
            setMarkdownContent(editingContent);
            setIsEditing(false);

            // Update markdown content on success
            setMarkdownContent(editingContent);
            setIsEditing(false);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[DumpPanel] ESC로 편집 종료 시 저장 실패:', error);
            }
            toast.error(
              `저장 실패: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          } finally {
            setIsSaving(false);
          }
        })();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEditing,
    editingContent,
    setIsEditing,
    setMarkdownContent,
    setIsSaving,
  ]);

  const handleContentChange = React.useCallback(
    (newContent: string) => {
      console.log('[DumpPanel] handleContentChange called', {
        newContentLength: newContent.length,
      });
      // Optimistic update: Update UI immediately for instant feedback
      setMarkdownContent(newContent);

      // Save in background
      void (async () => {
        try {
          setIsSaving(true);
          const { saveActiveDocument } = useDocumentStore.getState();
          const saveResult = await saveActiveDocument(newContent);

          if (!saveResult.success) {
            throw new Error(saveResult.error || 'Save failed');
          }
        } catch (error) {
          console.error('[DumpPanel] 체크박스 상태 저장 실패:', error);
          toast.error('체크박스 상태 저장 실패');
          // Note: Could implement rollback here if needed
        } finally {
          setIsSaving(false);
        }
      })();
    },
    [setIsSaving, setMarkdownContent]
  );

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden border-r ${
        isDarkMode
          ? 'bg-[#0f141f] text-slate-100 border-white/10'
          : 'bg-white text-slate-900 border-slate-200/50'
      }`}
    >
      {/* Header */}
      <div
        className={`flex h-14 items-center justify-between border-b px-6 ${
          isDarkMode ? 'border-white/10' : 'border-slate-200/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
            쏟아내기
          </span>
          {currentDateLabel && (
            <span
              className={`text-[10px] font-normal normal-case tracking-normal ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              · {currentDateLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <Badge variant="subtle-default" size="sm">
              저장 중
            </Badge>
          )}
          <Button
            variant="hoego"
            size="icon-md"
            shape="pill"
            onClick={handleToggleEdit}
            title={isEditing ? '미리보기' : '편집'}
            aria-label={isEditing ? '미리보기' : '편집'}
          >
            {isEditing ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <textarea
            ref={editorRef}
            value={editingContent}
            onChange={handleEditorChange}
            className={`w-full h-full px-10 py-6 pb-24 font-mono text-sm resize-none outline-none ${
              isDarkMode
                ? 'bg-[#0f141f] text-slate-100'
                : 'bg-white text-slate-900'
            }`}
            placeholder="여기에 내용을 입력하세요..."
            spellCheck={false}
          />
        ) : (
          <div ref={markdownRef} className="h-full overflow-y-auto">
            <MarkdownViewer
              content={dumpContent}
              isDarkMode={isDarkMode}
              className="px-10 py-6 pb-24"
              onContentChange={handleContentChange}
            />
          </div>
        )}
      </div>
    </section>
  );
});
