import React from 'react';
import { createPortal } from 'react-dom';

import type { RetrospectiveTemplate } from '@/constants/retrospectiveTemplates';

interface TemplatePickerDropdownProps {
  isDarkMode: boolean;
  isTemplatePickerOpen: boolean;
  templateDropdownRef: React.RefObject<HTMLDivElement>;
  templateDropdownPosition: { top: number; left: number; width: number };
  retrospectiveTemplates: RetrospectiveTemplate[];
  customRetrospectiveTemplates: RetrospectiveTemplate[];
  handleApplyRetrospectiveTemplate: (templateId: string) => void;
}

export const TemplatePickerDropdown = React.memo(
  function TemplatePickerDropdown({
    isDarkMode,
    isTemplatePickerOpen,
    templateDropdownRef,
    templateDropdownPosition,
    retrospectiveTemplates,
    customRetrospectiveTemplates,
    handleApplyRetrospectiveTemplate,
  }: TemplatePickerDropdownProps) {
    if (!isTemplatePickerOpen || typeof document === 'undefined') {
      return null;
    }

    return createPortal(
      <div
        ref={templateDropdownRef}
        onMouseDown={(e) => e.stopPropagation()}
        className={`fixed z-[9999] overflow-hidden rounded-xl border shadow-xl ${
          isDarkMode
            ? 'border-white/10 bg-[#05070c] text-slate-100'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
        style={{
          top: templateDropdownPosition.top,
          left: templateDropdownPosition.left,
          width: templateDropdownPosition.width,
        }}
      >
        <div
          className={`border-b px-3 py-2 text-[11px] ${
            isDarkMode
              ? 'border-white/5 text-slate-400'
              : 'border-slate-100 text-slate-500'
          }`}
        >
          <p className="font-semibold uppercase tracking-[0.25em] text-[10px]">
            검증된 회고 템플릿
          </p>
          <p className="tracking-normal">
            KPT · 4Ls · Start/Stop + 커스텀 템플릿
          </p>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {retrospectiveTemplates.map((template) => {
            const isCustom = customRetrospectiveTemplates.some(
              (custom) => custom.id === template.id
            );
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleApplyRetrospectiveTemplate(template.id)}
                className={`mb-2 w-full rounded-lg border px-3 py-2 text-left transition last:mb-0 ${
                  isDarkMode
                    ? 'border-white/10 bg-[#080b11] text-slate-100 hover:border-white/30 hover:bg-white/5'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">{template.name}</p>
                    <p
                      className={`text-[11px] leading-4 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {template.description}
                    </p>
                  </div>
                  <span className="flex flex-col items-end gap-1">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isDarkMode
                          ? 'bg-white/5 text-slate-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {template.focus}
                    </span>
                    {isCustom && (
                      <span
                        className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] tracking-wide ${
                          isDarkMode
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        커스텀
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className={`mt-2 rounded-md border px-2 py-1 text-[11px] leading-4 whitespace-pre-line ${
                    isDarkMode
                      ? 'border-white/5 bg-[#0f141f] text-slate-200'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {template.example}
                </div>
                <div className="mt-2 text-right text-[11px] font-semibold text-sky-500">
                  삽입하기 ↵
                </div>
              </button>
            );
          })}
        </div>
      </div>,
      document.body
    );
  }
);
