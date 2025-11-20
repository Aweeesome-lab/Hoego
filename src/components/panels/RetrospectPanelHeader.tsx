import * as Select from '@radix-ui/react-select';
import {
  Check,
  ChevronDown,
  ChevronUp,
  NotebookPen,
  Columns,
} from 'lucide-react';
import React from 'react';

import { RETROSPECT_VIEW_OPTIONS } from './constants/retrospect-view-options';

interface RetrospectPanelHeaderProps {
  isDarkMode: boolean;
  isSavingRetrospect: boolean;
  isTemplatePickerOpen: boolean;
  setIsTemplatePickerOpen: (isOpen: boolean) => void;
  templateTriggerRef: React.RefObject<HTMLButtonElement>;
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
}

export const RetrospectPanelHeader = React.memo(function RetrospectPanelHeader({
  isDarkMode,
  isSavingRetrospect,
  isTemplatePickerOpen,
  setIsTemplatePickerOpen,
  templateTriggerRef,
  retrospectViewMode,
  setRetrospectViewMode,
  activeRetrospectViewOption,
}: RetrospectPanelHeaderProps) {
  return (
    <div className={`flex h-14 items-center justify-between border-b px-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200/50'}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
        회고하기(retrospect)
      </span>
      <div className="flex items-center gap-2">
        {isSavingRetrospect && (
          <span
            className={`rounded-full px-3 py-1 text-[10px] ${
              isDarkMode
                ? 'bg-white/10 text-slate-200'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            저장 중
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <button
            ref={templateTriggerRef}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsTemplatePickerOpen(!isTemplatePickerOpen)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
              isDarkMode
                ? 'border-white/10 bg-[#05070c] text-slate-200 hover:border-white/30'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
            title="검증된 회고 템플릿 삽입"
          >
            <NotebookPen className="h-4 w-4" />
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
          <Select.Root
            value={retrospectViewMode}
            onValueChange={(value) =>
              setRetrospectViewMode(value as 'edit' | 'preview' | 'split')
            }
          >
            <Select.Trigger
              className={`inline-flex h-8 w-10 items-center justify-center rounded-full border px-2 text-sm transition ${
                isDarkMode
                  ? 'border-white/10 bg-[#05070c] text-slate-200 hover:border-white/30'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
              }`}
              aria-label="회고 보기 모드"
              title="회고 보기 모드"
            >
              <span className="flex items-center justify-center text-current">
                {activeRetrospectViewOption?.icon ?? (
                  <Columns className="h-4 w-4" />
                )}
              </span>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                className={`z-50 overflow-hidden rounded-lg border shadow ${
                  isDarkMode
                    ? 'border-white/10 bg-[#05070c] text-slate-100'
                    : 'border-slate-200 bg-white text-slate-900'
                }`}
                position="popper"
                sideOffset={6}
              >
                <Select.ScrollUpButton className="flex items-center justify-center p-1">
                  <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                </Select.ScrollUpButton>
                <Select.Viewport className="p-1">
                  {RETROSPECT_VIEW_OPTIONS.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className={`relative flex cursor-pointer select-none flex-col gap-1 rounded px-3 py-2 text-xs transition hover:bg-slate-100 data-[state=checked]:font-semibold ${
                        isDarkMode ? 'hover:bg-white/10' : ''
                      }`}
                    >
                      <Select.ItemText>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          {option.icon}
                          {option.label}
                        </span>
                      </Select.ItemText>
                      <span
                        className={`text-[11px] ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {option.description}
                      </span>
                      <Select.ItemIndicator className="absolute right-2 top-2">
                        <Check className="h-3.5 w-3.5" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton className="flex items-center justify-center p-1">
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>
    </div>
  );
});
