interface EmptyStateProps {
  isDarkMode: boolean;
}

export default function EmptyState({ isDarkMode }: EmptyStateProps) {
  return (
    <div
      className={`p-7 text-center rounded-2xl border border-dashed ${
        isDarkMode
          ? 'border-slate-400/30 bg-slate-900/40 text-slate-400'
          : 'border-slate-300 bg-slate-50 text-slate-500'
      }`}
    >
      아직 저장된 Markdown 기록이 없습니다.
    </div>
  );
}
