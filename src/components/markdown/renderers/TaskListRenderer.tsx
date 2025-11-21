import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import React from 'react';

import type { TaskListItemProps } from '../types';

/**
 * Task list 체크박스 아이템 렌더러
 *
 * Radix UI Checkbox를 사용하여 접근성과 인터랙션을 보장합니다.
 * - 클릭/키보드로 토글 가능
 * - 저장 중 비활성화
 * - 다크모드 지원
 * - 호버/클릭 애니메이션
 *
 * @param checked - 체크 상태
 * @param onToggle - 토글 핸들러
 * @param children - 체크박스 옆 텍스트/콘텐츠
 * @param isDarkMode - 다크모드 여부
 * @param disabled - 비활성화 여부
 */
export const TaskListItemRenderer = React.memo(function TaskListItemRenderer({
  checked,
  onToggle,
  children,
  isDarkMode,
  disabled,
}: TaskListItemProps) {
  return (
    <li
      className="task-list-item !list-none !ml-0 !pl-0 flex items-start gap-2.5 leading-relaxed text-[13px] break-words transition-opacity duration-150"
      style={{
        listStyle: 'none',
        paddingLeft: 0,
        marginTop: '2px',
        marginBottom: '2px',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Checkbox.Root
        className={`mt-[3px] flex h-[18px] w-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-all duration-200 cursor-pointer ${
          isDarkMode
            ? 'border-slate-500 bg-slate-800/60 data-[state=checked]:border-emerald-400 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-emerald-500/25'
            : 'border-slate-300 bg-white shadow-sm data-[state=checked]:border-emerald-500 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-emerald-500/20'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-emerald-400 hover:scale-105 active:scale-95 data-[state=checked]:hover:shadow-emerald-500/40'
        }`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => {
          const nextChecked = value === true;
          if (nextChecked !== checked && !disabled) {
            void onToggle();
          }
        }}
        onClick={(e) => {
          // Prevent double-triggering
          e.stopPropagation();
        }}
        aria-label={checked ? '작업 완료됨' : '작업 미완료'}
        aria-checked={checked}
      >
        <Checkbox.Indicator className="animate-in zoom-in-75 duration-150">
          <Check
            className="h-3.5 w-3.5 text-white drop-shadow-sm"
            strokeWidth={3}
          />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <span
        className={`flex-1 select-text break-words transition-all duration-200 ${
          checked
            ? `line-through decoration-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`
            : isDarkMode
              ? 'text-slate-200'
              : 'text-slate-700'
        }`}
      >
        {children}
      </span>
    </li>
  );
});
