import React from "react";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { MemoizedReactMarkdown } from "@/components/markdown";

interface RetrospectContentAreaProps {
  isDarkMode: boolean;
  retrospectViewMode: "edit" | "preview" | "split";
  retrospectContent: string;
  setRetrospectContent: (content: string) => void;
  retrospectRef: React.RefObject<HTMLTextAreaElement>;
  markdownComponents: Components;
}

export const RetrospectContentArea = React.memo(function RetrospectContentArea({
  isDarkMode,
  retrospectViewMode,
  retrospectContent,
  setRetrospectContent,
  retrospectRef,
  markdownComponents,
}: RetrospectContentAreaProps) {
  return (
    <div className="flex-1 overflow-hidden px-3.5 py-2.5">
      <div
        className={`h-full w-full ${
          retrospectViewMode === "split"
            ? "grid gap-3 lg:grid-cols-2"
            : "flex flex-col"
        }`}
      >
        {retrospectViewMode !== "preview" && (
          <div className="h-full w-full overflow-y-auto">
            <textarea
              ref={retrospectRef}
              value={retrospectContent}
              onChange={(e) => setRetrospectContent(e.target.value)}
              className={`h-full w-full min-h-[260px] resize-none border-0 text-[13px] leading-5 outline-none ${
                isDarkMode
                  ? "bg-[#05070c] text-slate-100 placeholder:text-slate-500"
                  : "bg-white text-slate-900 placeholder:text-slate-400"
              }`}
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                padding: 12,
              }}
              placeholder="AI의 피드백을 보고 떠오르는 생각을 자유롭게 적어보세요..."
            />
          </div>
        )}
        {retrospectViewMode !== "edit" && (
          <div
            className={`h-full w-full overflow-y-auto rounded-xl border px-4 py-3 text-[13px] ${
              isDarkMode
                ? "border-white/10 bg-[#05070c] text-slate-100"
                : "border-slate-200 bg-slate-50 text-slate-900"
            }`}
          >
            <MemoizedReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {retrospectContent.trim()
                ? retrospectContent
                : "## ✍️ 회고 미리보기\n\n템플릿을 삽입하거나 내용을 작성하면 이 영역에서 마크다운이 적용된 회고를 실시간으로 확인할 수 있어요."}
            </MemoizedReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});
