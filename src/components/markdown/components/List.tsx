/**
 * List 컴포넌트 (ul, ol, li)
 */

import type { ListItemProps, ListProps } from '../types';

/**
 * 순서 없는 리스트 (Unordered List) - antigravity 스타일
 */
export function UnorderedList({ children, node }: ListProps) {
  // Task list는 TaskList 컴포넌트에서 처리
  const isTaskList = node?.properties?.className?.includes('contains-task-list');

  if (isTaskList) {
    // Task list는 별도 컴포넌트에서 처리하므로 className 전달
    return (
      <ul className="contains-task-list space-y-1.5 my-4">
        {children}
      </ul>
    );
  }

  return (
    <ul className="list-disc list-outside space-y-1.5 my-4 ml-6 pl-1">
      {children}
    </ul>
  );
}

/**
 * 순서 있는 리스트 (Ordered List) - antigravity 스타일
 */
export function OrderedList({ children, start }: ListProps) {
  return (
    <ol
      className="list-decimal list-outside space-y-1.5 my-4 ml-6 pl-1"
      start={start}
    >
      {children}
    </ol>
  );
}

/**
 * 리스트 아이템
 */
export function ListItem({ children, checked }: ListItemProps) {
  // Task list item인 경우 TaskListItem 컴포넌트에서 처리
  if (checked !== undefined && checked !== null) {
    // Task list는 별도로 처리
    return <li className="task-list-item">{children}</li>;
  }

  // 일반 리스트 아이템
  return <li className="leading-relaxed pl-1">{children}</li>;
}
