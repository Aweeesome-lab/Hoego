import type { RetrospectiveTemplate } from '@/constants/retrospectiveTemplates';
import type { Components } from 'react-markdown';

export interface RetrospectPanelProps {
  isDarkMode: boolean;
  isRetrospectPanelExpanded: boolean;
  retrospectContent: string;
  setRetrospectContent: (content: string) => void;
  retrospectRef: React.RefObject<HTMLTextAreaElement>;
  isSavingRetrospect: boolean;
  isTemplatePickerOpen: boolean;
  setIsTemplatePickerOpen: (isOpen: boolean) => void;
  templateTriggerRef: React.RefObject<HTMLButtonElement>;
  templateDropdownRef: React.RefObject<HTMLDivElement>;
  templateDropdownPosition: { top: number; left: number; width: number };
  retrospectiveTemplates: RetrospectiveTemplate[];
  customRetrospectiveTemplates: RetrospectiveTemplate[];
  handleApplyRetrospectiveTemplate: (templateId: string) => void;
  retrospectViewMode: 'edit' | 'preview' | 'split';
  setRetrospectViewMode: (mode: 'edit' | 'preview' | 'split') => void;
  activeRetrospectViewOption:
    | {
        value: 'edit' | 'preview' | 'split';
        label: string;
        description: string;
        icon: React.ReactNode;
      }
    | undefined;
  markdownComponents: Components;
}
