import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  isDarkMode?: boolean;
  isStreaming?: boolean;
  statusText?: string;
}

export function Response({
  children,
  className,
  isDarkMode,
  isStreaming = false,
  statusText = "생성 중...",
  ...props
}: ResponseProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-sm transition",
        isDarkMode
          ? "border-white/10 bg-white/5 text-slate-100"
          : "border-slate-200 bg-white text-slate-800",
        className
      )}
      {...props}
    >
      {isStreaming ? (
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{statusText}</span>
        </div>
      ) : null}
      <div className="text-[13px] leading-5 text-inherit">{children}</div>
    </div>
  );
}
