import { NotebookPen, Plus, Save, Trash2, RefreshCcw } from 'lucide-react';
import React from 'react';

import {
  CUSTOM_RETROSPECTIVE_STORAGE_KEY,
  type RetrospectiveTemplate,
} from '@/constants/retrospectiveTemplates';

interface RetrospectiveTemplateSettingsProps {
  isDarkMode?: boolean;
}

const emptyForm = {
  name: '',
  focus: '',
  description: '',
  example: '',
  markdown: '',
};

function loadCustomTemplates(): RetrospectiveTemplate[] {
  try {
    const stored = localStorage.getItem(CUSTOM_RETROSPECTIVE_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item?.id === 'string');
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[hoego] 커스텀 회고 템플릿 로드 실패', error);
    }
    return [];
  }
}

function generateTemplateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function RetrospectiveTemplateSettings({
  isDarkMode,
}: RetrospectiveTemplateSettingsProps) {
  const [templates, setTemplates] = React.useState<RetrospectiveTemplate[]>(
    () => loadCustomTemplates()
  );
  const [form, setForm] = React.useState<typeof emptyForm>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const persistTemplates = React.useCallback(
    (next: RetrospectiveTemplate[]) => {
      localStorage.setItem(
        CUSTOM_RETROSPECTIVE_STORAGE_KEY,
        JSON.stringify(next)
      );
      setTemplates(next);
      setStatusMessage('저장되었습니다');
      setTimeout(() => setStatusMessage(null), 2000);
    },
    []
  );

  const resetForm = React.useCallback(() => {
    setForm(emptyForm);
    setEditingId(null);
    setErrorMessage(null);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim()) {
      setErrorMessage('템플릿 이름을 입력해주세요.');
      return;
    }
    if (!form.markdown.trim()) {
      setErrorMessage('마크다운 내용을 입력해주세요.');
      return;
    }
    if (!form.description.trim()) {
      setErrorMessage('설명을 입력해주세요.');
      return;
    }
    if (!form.focus.trim()) {
      setErrorMessage('포커스/특징을 입력해주세요.');
      return;
    }
    if (!form.example.trim()) {
      setErrorMessage('예시를 입력해주세요.');
      return;
    }

    if (editingId) {
      const updated = templates.map((template) =>
        template.id === editingId ? { ...template, ...form } : template
      );
      persistTemplates(updated);
      resetForm();
      return;
    }

    const newTemplate: RetrospectiveTemplate = {
      id: generateTemplateId(),
      ...form,
    };
    persistTemplates([newTemplate, ...templates]);
    resetForm();
  };

  const handleEdit = (template: RetrospectiveTemplate) => {
    setForm({
      name: template.name,
      focus: template.focus,
      description: template.description,
      example: template.example,
      markdown: template.markdown,
    });
    setEditingId(template.id);
    setErrorMessage(null);
  };

  const handleDelete = (templateId: string) => {
    if (
      !window.confirm(
        '선택한 템플릿을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.'
      )
    ) {
      return;
    }
    const remaining = templates.filter(
      (template) => template.id !== templateId
    );
    persistTemplates(remaining);
    if (editingId === templateId) {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border p-4 ${
          isDarkMode
            ? 'bg-white/5 border-white/10 text-slate-200'
            : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <NotebookPen className="h-4 w-4" />
          <span>커스텀 회고 템플릿</span>
        </div>
        <p
          className={`mt-2 text-[12px] ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          팀에 맞는 회고 프롬프트를 추가하고 오버레이에서 즉시 사용할 수 있어요.
          이름·포커스·설명·예시·마크다운 뼈대를 입력하면 템플릿 드롭다운에
          자동으로 합쳐집니다.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`rounded-xl border p-4 space-y-4 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-[12px] font-semibold ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {editingId ? '템플릿 수정' : '새 템플릿 추가'}
          </h3>
          {statusMessage && (
            <span
              className={`text-[11px] ${
                isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
              }`}
            >
              {statusMessage}
            </span>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              템플릿 이름
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                isDarkMode
                  ? 'border-white/10 bg-[#060910] text-slate-100'
                  : 'border-slate-200 bg-white text-slate-900'
              }`}
              placeholder="예: Deep Dive Retro"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              포커스 / 특징
            </span>
            <input
              type="text"
              value={form.focus}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, focus: e.target.value }))
              }
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                isDarkMode
                  ? 'border-white/10 bg-[#060910] text-slate-100'
                  : 'border-slate-200 bg-white text-slate-900'
              }`}
              placeholder="예: 행동 합의 · 데이터 기반"
            />
          </label>
        </div>

        <label className="space-y-1 text-xs">
          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
            설명
          </span>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              isDarkMode
                ? 'border-white/10 bg-[#060910] text-slate-100'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
            rows={2}
            placeholder="템플릿 목적과 언제 사용하면 좋은지 설명해주세요."
          />
        </label>

        <label className="space-y-1 text-xs">
          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
            예시 (직관적인 샘플)
          </span>
          <textarea
            value={form.example}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, example: e.target.value }))
            }
            className={`w-full rounded-md border px-3 py-2 text-sm whitespace-pre-wrap ${
              isDarkMode
                ? 'border-white/10 bg-[#060910] text-slate-100'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
            rows={3}
            placeholder="예: Start - 매주 고객 피드백 리포트 공유..."
          />
        </label>

        <label className="space-y-1 text-xs">
          <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
            마크다운 템플릿
          </span>
          <textarea
            value={form.markdown}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, markdown: e.target.value }))
            }
            className={`w-full rounded-md border px-3 py-2 text-sm font-mono leading-5 ${
              isDarkMode
                ? 'border-white/10 bg-[#05070c] text-slate-100'
                : 'border-slate-200 bg-slate-50 text-slate-900'
            }`}
            rows={6}
            placeholder={`# 템플릿 제목
## 섹션 1
- 

## 섹션 2
- `}
          />
        </label>

        {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              isDarkMode
                ? 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30'
                : 'bg-blue-600/10 text-blue-700 hover:bg-blue-600/20'
            }`}
          >
            {editingId ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? '템플릿 업데이트' : '템플릿 추가'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition ${
                isDarkMode
                  ? 'border-white/10 text-slate-200 hover:bg-white/5'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              } border`}
            >
              <RefreshCcw className="h-4 w-4" />
              새로 작성
            </button>
          )}
        </div>
      </form>

      <div
        className={`rounded-xl border p-4 space-y-4 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-[12px] font-semibold ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            저장된 커스텀 템플릿 ({templates.length})
          </h3>
        </div>
        {templates.length === 0 ? (
          <p
            className={`text-[12px] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            아직 커스텀 템플릿이 없습니다. 위 폼에서 나만의 회고 템플릿을
            만들어보세요.
          </p>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`rounded-lg border p-3 ${
                  isDarkMode
                    ? 'border-white/10 bg-[#05070c]'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p
                      className={`text-[11px] ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {template.description}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isDarkMode
                          ? 'bg-white/5 text-slate-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {template.focus}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(template)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                        isDarkMode
                          ? 'border-white/10 text-slate-200 hover:bg-white/5'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      } border`}
                    >
                      <NotebookPen className="h-3.5 w-3.5" />
                      편집
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </div>
                </div>
                <div
                  className={`mt-3 rounded-md border px-3 py-2 text-[11px] whitespace-pre-wrap ${
                    isDarkMode
                      ? 'border-white/5 bg-[#0f141f] text-slate-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {template.example}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
