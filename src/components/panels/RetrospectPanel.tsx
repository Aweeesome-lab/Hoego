import React from "react";
import type { RetrospectPanelProps } from "./types/RetrospectPanelProps";
import { RetrospectPanelHeader } from "./RetrospectPanelHeader";
import { TemplatePickerDropdown } from "./TemplatePickerDropdown";
import { RetrospectContentArea } from "./RetrospectContentArea";

export function RetrospectPanel({
  isDarkMode,
  isRetrospectPanelExpanded,
  retrospectContent,
  setRetrospectContent,
  retrospectRef,
  isSavingRetrospect,
  isTemplatePickerOpen,
  setIsTemplatePickerOpen,
  templateTriggerRef,
  templateDropdownRef,
  templateDropdownPosition,
  retrospectiveTemplates,
  customRetrospectiveTemplates,
  handleApplyRetrospectiveTemplate,
  retrospectViewMode,
  setRetrospectViewMode,
  activeRetrospectViewOption,
  markdownComponents,
}: RetrospectPanelProps) {
  if (!isRetrospectPanelExpanded) return null;

  return (
    <section
      className={`flex flex-1 flex-col overflow-hidden ${
        isDarkMode
          ? "bg-[#0f141f] text-slate-100"
          : "bg-white text-slate-900"
      }`}
    >
      <RetrospectPanelHeader
        isDarkMode={isDarkMode}
        isSavingRetrospect={isSavingRetrospect}
        isTemplatePickerOpen={isTemplatePickerOpen}
        setIsTemplatePickerOpen={setIsTemplatePickerOpen}
        templateTriggerRef={templateTriggerRef}
        retrospectViewMode={retrospectViewMode}
        setRetrospectViewMode={setRetrospectViewMode}
        activeRetrospectViewOption={activeRetrospectViewOption}
      />
      <TemplatePickerDropdown
        isDarkMode={isDarkMode}
        isTemplatePickerOpen={isTemplatePickerOpen}
        templateDropdownRef={templateDropdownRef}
        templateDropdownPosition={templateDropdownPosition}
        retrospectiveTemplates={retrospectiveTemplates}
        customRetrospectiveTemplates={customRetrospectiveTemplates}
        handleApplyRetrospectiveTemplate={handleApplyRetrospectiveTemplate}
      />
      <RetrospectContentArea
        isDarkMode={isDarkMode}
        retrospectViewMode={retrospectViewMode}
        retrospectContent={retrospectContent}
        setRetrospectContent={setRetrospectContent}
        retrospectRef={retrospectRef}
        markdownComponents={markdownComponents}
      />
    </section>
  );
}
