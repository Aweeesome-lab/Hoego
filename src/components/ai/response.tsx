import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  isDarkMode?: boolean;
  content?: string; // 전달되면 문자열 마크다운을 렌더링
}

export function Response({
  children,
  className,
  isDarkMode,
  content,
  ...props
}: ResponseProps) {
  const base = cn(
    "rounded-2xl px-4 py-3 transition",
    isDarkMode ? "bg-white/5 text-slate-100" : "bg-white text-slate-800",
    className
  );

  return (
    <div className={base} {...props}>
      {typeof content === "string" ? (
        <div
          className={cn(
            "prose prose-sm max-w-none",
            isDarkMode ? "prose-invert text-slate-200" : "text-slate-700"
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-[13px] leading-5 text-inherit">{children}</div>
      )}
    </div>
  );
}
