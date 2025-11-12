interface ThinkingIndicatorProps {
  isDarkMode?: boolean;
}

export function ThinkingIndicator({ isDarkMode }: ThinkingIndicatorProps) {
  const accent = isDarkMode ? "bg-emerald-300/80" : "bg-emerald-500";
  const track = isDarkMode ? "bg-emerald-300/20" : "bg-emerald-500/20";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`h-2 w-2 rounded-full ${accent} animate-pulse`}
        />
        <span className={`mt-1 h-12 w-0.5 rounded-full ${track} animate-pulse`} />
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-emerald-500 dark:text-emerald-300">
          생각 정리 중...
        </p>
        <p className={`text-xs leading-5 ${textMuted}`}>
          오늘 기록을 훑어보고 가장 중요한 포인트를 찾고 있어요.
        </p>
      </div>
    </div>
  );
}
