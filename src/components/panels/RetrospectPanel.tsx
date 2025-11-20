import { RetrospectContentArea } from './RetrospectContentArea';
import { RetrospectPanelHeader } from './RetrospectPanelHeader';

import type { Components } from 'react-markdown';

interface RetrospectPanelProps {
  isDarkMode: boolean;
  isRetrospectPanelExpanded: boolean;
  retrospectContent: string;
  setRetrospectContent: (content: string) => void;
  retrospectRef: React.RefObject<HTMLTextAreaElement>;
  isSavingRetrospect: boolean;
  isEditingRetrospect: boolean;
  setIsEditingRetrospect: (isEditing: boolean) => void;
  markdownComponents: Components;
}

export function RetrospectPanel({
  isDarkMode,
  isRetrospectPanelExpanded,
  retrospectContent,
  setRetrospectContent,
  retrospectRef,
  isSavingRetrospect,
  isEditingRetrospect,
  setIsEditingRetrospect,
  markdownComponents,
}: RetrospectPanelProps) {
  if (!isRetrospectPanelExpanded) return null;

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden ${
        isDarkMode ? 'bg-[#0f141f] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      <RetrospectPanelHeader
        isDarkMode={isDarkMode}
        isSavingRetrospect={isSavingRetrospect}
        isEditing={isEditingRetrospect}
        setIsEditing={setIsEditingRetrospect}
      />
      <RetrospectContentArea
        isDarkMode={isDarkMode}
        isEditing={isEditingRetrospect}
        retrospectContent={retrospectContent}
        setRetrospectContent={setRetrospectContent}
        retrospectRef={retrospectRef}
        markdownComponents={markdownComponents}
      />
    </section>
  );
}
