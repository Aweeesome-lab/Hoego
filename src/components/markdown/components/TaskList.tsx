/**
 * TaskList 컴포넌트 - 체크박스 리스트 아이템
 */

'use client';

import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import type { ListItemProps } from '../types';
import { useTaskToggle } from '../hooks/useTaskToggle';

/**
 * Task List 아이템 렌더러
 *
 * 3단계 감지 방식:
 * 1. React-markdown props의 checked 값
 * 2. AST 노드의 checked 프로퍼티 (remark-gfm)
 * 3. Children에서 checkbox input 스캔
 */
export function TaskListItem({ children, checked, node, isDarkMode }: ListItemProps) {
  const { toggleTaskCheckbox, isSaving } = useTaskToggle();

  // 1단계: Props에서 checked 확인
  let isChecked: boolean | null = checked ?? null;
  let isTaskList = checked !== undefined && checked !== null;

  // 2단계: 노드에서 checked 확인 (remark-gfm)
  if (!isTaskList && node && 'checked' in node && node.checked !== undefined) {
    isChecked = Boolean(node.checked);
    isTaskList = true;
  }

  // 3단계: Children에서 checkbox input 스캔
  const childArray = useMemo(() => {
    if (Array.isArray(children)) return children;
    return [children];
  }, [children]);

  const checkboxChild = useMemo(() => {
    return childArray.find((child: any) => {
      if (child?.type === 'input' && child?.props) {
        return child.props.type === 'checkbox';
      }
      return false;
    });
  }, [childArray]);

  if (!isTaskList && checkboxChild) {
    isChecked = Boolean((checkboxChild as any).props?.checked);
    isTaskList = true;
  }

  // Task list가 아니면 null 반환 (List.tsx에서 처리)
  if (!isTaskList) {
    return null;
  }

  // 기본 checkbox input 필터링 (중복 방지)
  const filteredChildren = useMemo(() => {
    return childArray.filter((child: any) => {
      if (child?.type === 'input' && child?.props) {
        return child.props.type !== 'checkbox';
      }
      return true;
    });
  }, [childArray]);

  // 토글 핸들러
  const handleToggle = useCallback(() => {
    if (isSaving) return;

    const position = node?.position;
    const nextChecked = !isChecked;

    void toggleTaskCheckbox(position, nextChecked);
  }, [isSaving, isChecked, node?.position, toggleTaskCheckbox]);

  // 체크박스 스타일 - 개선된 디자인
  const checkboxBaseStyle = `
    mt-0.5 flex h-5 w-5 min-w-[20px] flex-shrink-0
    items-center justify-center rounded-md
    border-2 transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    shadow-sm
  `;

  const checkboxColorStyle = isDarkMode
    ? `
      border-gray-600 bg-gray-900/80
      data-[state=checked]:border-emerald-400
      data-[state=checked]:bg-gradient-to-br
      data-[state=checked]:from-emerald-500
      data-[state=checked]:to-emerald-600
      data-[state=checked]:shadow-md
      data-[state=checked]:shadow-emerald-500/20
      hover:border-gray-500
      hover:bg-gray-800/90
      focus:ring-emerald-500
    `
    : `
      border-gray-300 bg-white
      data-[state=checked]:border-emerald-500
      data-[state=checked]:bg-gradient-to-br
      data-[state=checked]:from-emerald-400
      data-[state=checked]:to-emerald-500
      data-[state=checked]:shadow-md
      data-[state=checked]:shadow-emerald-500/20
      hover:border-gray-400
      hover:bg-gray-50
      focus:ring-emerald-400
    `;

  const disabledStyle = isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  const textStyle = isChecked
    ? `line-through ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`
    : isDarkMode
      ? 'text-gray-200'
      : 'text-gray-800';

  return (
    <li
      className={`
        task-list-item flex items-start gap-2.5 my-1
        transition-opacity duration-150
        ${isSaving ? 'opacity-75' : ''}
      `}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Radix Checkbox */}
      <Checkbox.Root
        className={`${checkboxBaseStyle} ${checkboxColorStyle} ${disabledStyle}`}
        checked={isChecked ?? false}
        onCheckedChange={handleToggle}
        disabled={isSaving}
        aria-label={isChecked ? 'Uncheck task' : 'Check task'}
      >
        <Checkbox.Indicator className="flex items-center justify-center">
          <Check
            className={`
              w-3.5 h-3.5 stroke-[3]
              ${isDarkMode ? 'text-white' : 'text-white'}
            `}
          />
        </Checkbox.Indicator>
      </Checkbox.Root>

      {/* 텍스트 콘텐츠 */}
      <span className={`flex-1 leading-relaxed text-sm ${textStyle}`}>
        {filteredChildren}
      </span>
    </li>
  );
}
