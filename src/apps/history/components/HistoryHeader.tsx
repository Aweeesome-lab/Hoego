interface HistoryHeaderProps {
  directory: string;
  onRefresh: () => void;
  onOpenFolder: () => void;
  isDarkMode: boolean;
}

export default function HistoryHeader({
  directory,
  onRefresh,
  onOpenFolder,
  isDarkMode,
}: HistoryHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-5">
      <div>
        <h1
          className={`text-[1.9rem] font-bold m-0 ${
            isDarkMode ? 'text-slate-50' : 'text-slate-900'
          }`}
        >
          데일리 트래킹
        </h1>
        <p
          className={`mt-2 text-[0.9rem] break-all ${
            isDarkMode ? 'text-slate-400/75' : 'text-slate-500'
          }`}
        >
          {directory}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenFolder}
          className={`border rounded-full text-[0.85rem] px-4.5 py-2 transition-all ${
            isDarkMode
              ? 'border-slate-400/30 bg-slate-400/10 text-slate-100 hover:bg-slate-400/20 hover:border-slate-400/50'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          폴더 열기
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className={`border rounded-full text-[0.85rem] px-4.5 py-2 transition-all ${
            isDarkMode
              ? 'border-slate-400/30 bg-slate-400/10 text-slate-100 hover:bg-slate-400/20 hover:border-slate-400/50'
              : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          새로고침
        </button>
      </div>
    </header>
  );
}
