import {
  Brain,
  Cloud,
  Settings,
  Info,
  Sun,
  Moon,
  MonitorSmartphone,
} from 'lucide-react';
import React from 'react';

import { useTheme } from '@/hooks/useTheme';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface SettingsSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
}

export const sidebarItems: SidebarItem[] = [
  { id: 'models', label: '로컬 모델', icon: Brain },
  // TODO: Beta 테스트 후 클라우드 LLM 활성화
  // { id: 'cloud', label: '클라우드 LLM', icon: Cloud },
  { id: 'general', label: '일반', icon: Settings },
  { id: 'about', label: '정보', icon: Info },
];

export function SettingsSidebar({
  activeTab,
  setActiveTab,
  isDarkMode,
}: SettingsSidebarProps) {
  const { themeMode, setThemeMode } = useTheme();

  return (
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
                    ? 'bg-[#5c8a6c]/20 text-matcha-300'
                    : 'bg-matcha-50 text-matcha-600'
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
                  ? 'bg-[#5c8a6c]/20 text-matcha-300'
                  : 'bg-matcha-50 text-matcha-600'
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
                  ? 'bg-[#5c8a6c]/20 text-matcha-300'
                  : 'bg-matcha-50 text-matcha-600'
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
                  ? 'bg-[#5c8a6c]/20 text-matcha-300'
                  : 'bg-matcha-50 text-matcha-600'
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
  );
}
