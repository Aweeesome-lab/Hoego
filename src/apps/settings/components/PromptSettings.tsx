import { invoke } from '@tauri-apps/api/tauri';
import { FileText, Save, RotateCcw, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface PromptConfig {
  id: string;
  name: string;
  user_prompt: string;
  created_at: string;
  is_active: boolean;
}

interface PromptSettingsProps {
  isDarkMode: boolean;
}

export function PromptSettings({ isDarkMode }: PromptSettingsProps) {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [_activePrompt, setActivePrompt] = useState<PromptConfig | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [promptName, setPromptName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false); // MVP Phase 0: 기본 숨김

  // System prompt is fixed
  const systemPrompt =
    "당신은 '사고 피드백 코치(Logical Mirror)'입니다. 사용자가 덤프한 하루 기록을 읽고, 그중 사고의 질을 바꾸는 데 의미 있는 부분만 선별하여 피드백을 제공합니다. 감정에 치우치지 말고, 객관적·논리적 사고 관점에서 평가하고 제안하세요. 감정보다 사고 구조·논리 전개·판단 근거를 중심으로 분석하고, 반복되는 사고 패턴, 왜곡, 모순을 찾아내며, 사용자가 스스로 사고 습관을 재정의할 수 있도록 구체적 질문을 제시하세요.";

  // Default user prompt template
  const defaultUserPrompt = `아래는 사용자가 오늘 작성한 일지입니다:

===== 일지 시작 =====
{content}
===== 일지 끝 =====

위 일지 내용을 꼼꼼히 읽고 분석한 후, 아래 형식에 맞춰 사고 회고 리포트를 작성하세요:

# 📅 오늘 — 사고 회고 리포트

## 🧩 회고 대상 포인트 (선별)
일지에서 실제로 언급된 내용 중 핵심 문장이나 주제를 최대 5개 선별하고 각각에 대해:
- 💬 **논리 분석:** 해당 부분의 사고 구조/전개에서의 강점과 약점
- ⚖️ **객관 평가:** 감정적 판단인지, 근거 중심 판단인지 구분
- ❓ **확장 질문:** 다음 사고로 발전시키는 질문 1줄

## 🔍 사고 구조 분석
일지에 나타난 사고의 흐름과 인과관계, 가정, 전제의 일관성을 논리적으로 평가 (3~5줄)

## 🪞 자기 인식 패턴
- 일지에서 반복적으로 등장한 사고/감정 키워드
- 사고의 방향성(확장적/방어적/회피적 등)
- 오늘의 메타 인사이트 한 문장:
> "(일지 내용을 바탕으로 한 구체적인 인사이트)"

## ⏰ 시간/에너지 리듬
- 일지에 나타난 집중 흐름 및 사고 밀도 추정
- 생산적 사고 vs 자동 사고 비율 피드백

## 📌 성장 제안
일지 분석을 바탕으로 한 사고 훈련 포인트 2~3가지 구체적으로 제시

## 💬 코치 메모
> 오늘 일지 전체의 사고 리듬에 대한 총평 1~2문장`;

  useEffect(() => {
    void loadPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPrompts = async () => {
    try {
      const configs = await invoke<PromptConfig[]>('get_prompt_configs');
      setPrompts(configs);

      const active = configs.find((p) => p.is_active);
      if (active) {
        setActivePrompt(active);
        setEditingPrompt(active.user_prompt);
        setPromptName(active.name);
      } else {
        // If no saved prompts, use default
        setEditingPrompt(defaultUserPrompt);
        setPromptName('기본 프롬프트');
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
      // Use default on error
      setEditingPrompt(defaultUserPrompt);
      setPromptName('기본 프롬프트');
    }
  };

  const savePrompt = () => {
    void (async () => {
      if (!promptName.trim()) {
        toast.error('프롬프트 이름을 입력해주세요.');
        return;
      }

      setIsSaving(true);
      try {
        await invoke('save_prompt_config', {
          name: promptName,
          userPrompt: editingPrompt,
        });
        await loadPrompts();
        toast.success('프롬프트가 저장되었습니다.');
      } catch (error) {
        console.error('Failed to save prompt:', error);
        toast.error('프롬프트 저장에 실패했습니다.');
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const activatePrompt = (promptId: string) => {
    void (async () => {
      try {
        await invoke('activate_prompt_config', { promptId });
        await loadPrompts();
      } catch (error) {
        console.error('Failed to activate prompt:', error);
        toast.error('프롬프트 활성화에 실패했습니다.');
      }
    })();
  };

  const loadPromptVersion = (prompt: PromptConfig) => {
    setActivePrompt(prompt);
    setEditingPrompt(prompt.user_prompt);
    setPromptName(prompt.name);
  };

  const resetToDefault = () => {
    setEditingPrompt(defaultUserPrompt);
    setPromptName('기본 프롬프트');
  };

  return (
    <div className="space-y-6">
      {/* System Prompt (Read-only) */}
      <div>
        <h3
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          시스템 프롬프트 (고정)
        </h3>
        <div
          className={`rounded-xl border p-4 ${
            isDarkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p
            className={`text-[12px] leading-relaxed ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {systemPrompt}
          </p>
        </div>
      </div>

      {/* User Prompt (Editable) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3
            className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            사용자 프롬프트 템플릿
          </h3>
          <button
            onClick={resetToDefault}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md transition ${
              isDarkMode
                ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            기본값으로 초기화
          </button>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            isDarkMode
              ? 'bg-white/5 border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Prompt Name */}
          <div className="mb-3">
            <label
              className={`block text-[11px] font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              프롬프트 이름
            </label>
            <input
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder="예: 성장 중심 피드백"
              className={`w-full px-3 py-1.5 text-[12px] rounded-md border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-slate-200 placeholder-slate-600'
                  : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Prompt Template Editor */}
          <div className="mb-3">
            <label
              className={`block text-[11px] font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              프롬프트 템플릿 (마크다운 지원)
            </label>
            <textarea
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              rows={15}
              className={`w-full px-3 py-2 text-[12px] leading-relaxed rounded-md border font-mono resize-y ${
                isDarkMode
                  ? 'bg-black/30 border-white/10 text-slate-200 placeholder-slate-600'
                  : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'
              }`}
              placeholder="프롬프트 템플릿을 입력하세요. {content}는 일지 내용으로 치환됩니다."
            />
            <p
              className={`text-[10px] mt-1.5 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              팁: {'{content}'} 부분에 사용자의 일지 내용이 자동으로 삽입됩니다.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={savePrompt}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] rounded-md transition ${
                isDarkMode
                  ? 'bg-[#5c8a6c]/20 text-matcha-300 hover:bg-[#5c8a6c]/30 disabled:opacity-50'
                  : 'bg-matcha-50 text-matcha-600 hover:bg-matcha-100 disabled:opacity-50'
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? '저장 중...' : '프롬프트 저장'}
            </button>
          </div>
        </div>
      </div>

      {/* Version History */}
      {prompts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              저장된 프롬프트 버전
            </h3>
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {showVersionHistory ? '숨기기' : '보기'}
            </button>
          </div>
          {showVersionHistory && (
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className={`rounded-lg border p-3 ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-3.5 w-3.5" />
                        <h4
                          className={`text-[12px] font-medium ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-900'
                          }`}
                        >
                          {prompt.name}
                        </h4>
                        {prompt.is_active && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isDarkMode
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-green-50 text-green-600'
                            }`}
                          >
                            활성
                          </span>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-[10px] ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {new Date(prompt.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!prompt.is_active && (
                        <button
                          onClick={() => activatePrompt(prompt.id)}
                          className={`px-2 py-1 text-[10px] rounded transition ${
                            isDarkMode
                              ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                        >
                          활성화
                        </button>
                      )}
                      <button
                        onClick={() => loadPromptVersion(prompt)}
                        className={`px-2 py-1 text-[10px] rounded transition ${
                          isDarkMode
                            ? 'text-slate-400 hover:bg-white/5 hover:text-slate-300'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        불러오기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
