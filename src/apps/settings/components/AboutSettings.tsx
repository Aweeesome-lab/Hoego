interface AboutSettingsProps {
  isDarkMode: boolean;
}

export function AboutSettings({ isDarkMode }: AboutSettingsProps) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <div className="space-y-4">
        <div>
          <h3
            className={`text-[13px] font-semibold mb-1 ${
              isDarkMode ? 'text-slate-200' : 'text-slate-900'
            }`}
          >
            Hoego
          </h3>
          <p
            className={`text-[12px] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            버전 0.1.0-beta
          </p>
        </div>

        <div>
          <p
            className={`text-[12px] leading-relaxed mb-3 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            생각을 쏟아내고, AI와 함께 정리하고, 하루를 돌아보세요.
          </p>
          <ul
            className={`text-[11px] space-y-1.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <li>• 단축키 한 번으로 빠르게 기록</li>
            <li>• AI가 하루를 분석하고 피드백 제공</li>
            <li>• 인터넷 없이 완전한 오프라인 사용</li>
            <li>• 모든 데이터는 내 컴퓨터에만 저장</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
