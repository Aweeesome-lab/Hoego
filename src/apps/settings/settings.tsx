import React from 'react';
import ReactDOM from 'react-dom/client';

import { AboutSettings } from './components/AboutSettings';
// TODO: Beta 테스트 후 클라우드 LLM 활성화
// import { CloudLLMSettings } from './components/CloudLLMSettings';
import { GeneralSettings } from './components/GeneralSettings';
import { LLMSettings } from './components/LLMSettings';
import { SettingsSidebar, sidebarItems } from './components/SettingsSidebar';

import { useTheme } from '@/hooks/useTheme';
import '@/styles/index.css';

function LLMSettingsApp() {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = React.useState('models'); // Beta: 기본 탭을 로컬 모델로 변경

  return (
    <div
      className={`h-screen flex overflow-hidden ${
        isDarkMode ? 'bg-[#111625]' : 'bg-gray-50'
      }`}
    >
      {/* Sidebar */}
      <SettingsSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
      />

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
            {activeTab === 'models' && <LLMSettings isDarkMode={isDarkMode} />}

            {/* TODO: Beta 테스트 후 클라우드 LLM 활성화 */}
            {/* {activeTab === 'cloud' && (
              <CloudLLMSettings isDarkMode={isDarkMode} />
            )} */}

            {activeTab === 'general' && (
              <GeneralSettings isDarkMode={isDarkMode} />
            )}

            {activeTab === 'about' && <AboutSettings isDarkMode={isDarkMode} />}
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
