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
            Hoego Local LLM
          </h3>
          <p
            className={`text-[12px] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            버전 1.0.0
          </p>
        </div>

        <div>
          <h4
            className={`text-[12px] font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            특징
          </h4>
          <ul
            className={`text-[11px] space-y-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <li>• 완전한 오프라인 작동</li>
            <li>• llama.cpp 엔진 내장</li>
            <li>• 다양한 GGUF 모델 지원</li>
            <li>• GPU 가속 지원</li>
          </ul>
        </div>

        <div>
          <h4
            className={`text-[12px] font-medium mb-2 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            엔진
          </h4>
          <p
            className={`text-[11px] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            llama.cpp (내장 바이너리)
          </p>
        </div>
      </div>
    </div>
  );
}
