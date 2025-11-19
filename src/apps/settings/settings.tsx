import {
  Info,
  Moon,
  Sun,
  MonitorSmartphone,
  FileText,
  NotebookPen,
} from 'lucide-react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { PromptSettings } from './components/PromptSettings';
import { RetrospectiveTemplateSettings } from './components/RetrospectiveTemplateSettings';
// import { WeeklyDashboard } from './components/WeeklyDashboard'; // MVP Phase 0: 숨김
import '@/styles/index.css';

function LLMSettingsApp() {
  // Theme mode: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark' | 'system'>(
    () => {
      const stored = localStorage.getItem('hoego_theme_mode');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return 'system';
    }
  );

  // Actual dark mode state (computed from themeMode)
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const stored = localStorage.getItem('hoego_theme_mode');
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
    // system or no stored value
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  const [activeTab, setActiveTab] = React.useState('prompts'); // MVP Phase 0: 기본 탭을 프롬프트로 변경

  // Apply theme to document
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#111625';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
    }
  }, [isDarkMode]);

  // System theme detection and update
  React.useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDarkMode(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Save themeMode to localStorage
  React.useEffect(() => {
    localStorage.setItem('hoego_theme_mode', themeMode);

    // Update isDarkMode based on themeMode
    if (themeMode === 'light') {
      setIsDarkMode(false);
    } else if (themeMode === 'dark') {
      setIsDarkMode(true);
    }
    // For 'system', the effect above handles it
  }, [themeMode]);

  // Cross-window theme synchronization
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hoego_theme_mode' && e.newValue) {
        const newMode = e.newValue;
        if (newMode === 'light' || newMode === 'dark' || newMode === 'system') {
          setThemeMode(newMode);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const sidebarItems = [
    // { id: 'weekly', label: '주간 회고', icon: BarChart3 }, // MVP Phase 0: 숨김
    // { id: 'models', label: '모델', icon: Brain }, // MVP Phase 0: 로컬 LLM 지원 제거
    // { id: 'cloud', label: '클라우드 LLM', icon: Cloud }, // MVP Phase 0: API 키 설정 제거 (내장)
    { id: 'prompts', label: '프롬프트', icon: FileText },
    { id: 'retros', label: '회고 템플릿', icon: NotebookPen },
    // { id: 'downloads', label: '다운로드', icon: Download }, // MVP Phase 0: 사용하지 않는 메뉴 제거
    // { id: 'settings', label: '일반 설정', icon: Settings }, // MVP Phase 0: 로컬 모델 설정 불필요
    { id: 'about', label: '정보', icon: Info },
  ];

  return (
    <div
      className={`h-screen flex overflow-hidden ${
        isDarkMode ? 'bg-[#111625]' : 'bg-gray-50'
      }`}
    >
      {/* Sidebar */}
      <div
        className={`w-52 flex-shrink-0 border-r ${
          isDarkMode
            ? 'bg-[#1a1f2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 py-4 border-b ${
            isDarkMode ? 'border-white/10' : 'border-slate-100'
          }`}
        >
          <h1
            className={`text-[13px] font-semibold ${
              isDarkMode ? 'text-slate-200' : 'text-slate-900'
            }`}
          >
            설정
          </h1>
          <p
            className={`text-[11px] mt-0.5 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Hoego 설정 관리
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition mb-0.5 ${
                  isActive
                    ? isDarkMode
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-50 text-blue-600'
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer - Theme Selector */}
        <div className="mt-auto p-4 space-y-2">
          <div
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 ${
              isDarkMode ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            테마
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setThemeMode('light')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] transition ${
                themeMode === 'light'
                  ? isDarkMode
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>라이트</span>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] transition ${
                themeMode === 'dark'
                  ? isDarkMode
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>다크</span>
            </button>
            <button
              onClick={() => setThemeMode('system')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] transition ${
                themeMode === 'system'
                  ? isDarkMode
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MonitorSmartphone className="h-3.5 w-3.5" />
              <span>시스템</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Header */}
        <div
          className={`px-6 py-4 border-b ${
            isDarkMode ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <h2
            className={`text-[15px] font-semibold ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {sidebarItems.find((item) => item.id === activeTab)?.label}
          </h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {/* MVP Phase 0: Weekly Dashboard 숨김 */}
            {/* {activeTab === 'weekly' && (
              <WeeklyDashboard isDarkMode={isDarkMode} />
            )} */}

            {/* MVP Phase 0: 로컬 LLM 지원 제거 */}
            {/* {activeTab === 'models' && <LLMSettings isDarkMode={isDarkMode} />} */}

            {/* MVP Phase 0: 클라우드 LLM 설정 제거 (내장) */}
            {/* {activeTab === 'cloud' && (
              <CloudLLMSettings isDarkMode={isDarkMode} />
            )} */}

            {activeTab === 'prompts' && (
              <PromptSettings isDarkMode={isDarkMode} />
            )}

            {/* MVP Phase 0: 다운로드 메뉴 제거 */}
            {/* {activeTab === 'downloads' && (
              <div
                className={`rounded-xl border p-8 text-center ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Download
                  className={`h-12 w-12 mx-auto mb-4 ${
                    isDarkMode ? 'text-slate-600' : 'text-slate-300'
                  }`}
                />
                <p
                  className={`text-[13px] ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  다운로드 기록이 없습니다
                </p>
              </div>
            )} */}

            {/* MVP Phase 0: 일반 설정 제거 (로컬 모델 설정 불필요) */}
            {/* {activeTab === 'settings' && (
              <div className="space-y-6">
                (로컬 모델 경로, GPU 설정 등 제거)
              </div>
            )} */}

            {activeTab === 'retros' && (
              <RetrospectiveTemplateSettings isDarkMode={isDarkMode} />
            )}

            {activeTab === 'about' && (
              <div
                className={`rounded-xl border p-6 ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-slate-200'
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('settings-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LLMSettingsApp />
    </React.StrictMode>
  );
}
