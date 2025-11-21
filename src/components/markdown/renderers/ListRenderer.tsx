import React from 'react';

interface ListRendererProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  isTaskList?: boolean;
}

/**
 * 순서 없는 리스트 렌더러 (ul)
 *
 * Task list인 경우 list-style을 제거합니다.
 */
export function UnorderedListRenderer({
  children,
  isTaskList = false,
  ...props
}: ListRendererProps & React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      {...props}
      className={
        isTaskList
          ? 'mb-3 ml-0 list-none text-sm leading-[1.75] break-words space-y-1.5'
          : 'mb-3 ml-5 list-disc text-sm leading-[1.75] break-words marker:text-slate-400 space-y-1.5'
      }
      style={{ marginTop: 0, paddingLeft: isTaskList ? 0 : undefined }}
    >
      {children}
    </ul>
  );
}

/**
 * 순서 있는 리스트 렌더러 (ol)
 */
export function OrderedListRenderer({
  children,
  ...props
}: Omit<ListRendererProps, 'isTaskList'> &
  React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      {...props}
      className="mb-3 ml-5 list-decimal text-sm leading-[1.75] break-words marker:text-slate-400 space-y-1.5"
      style={{ marginTop: 0 }}
    >
      {children}
    </ol>
  );
}

/**
 * 일반 리스트 아이템 렌더러 (li)
 *
 * Task list 아이템은 TaskListRenderer에서 처리합니다.
 */
export function ListItemRenderer({
  children,
  ...props
}: Omit<ListRendererProps, 'isDarkMode' | 'isTaskList'> &
  React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      {...props}
      className="leading-[1.75] text-sm break-words"
      style={{ marginTop: '2px', marginBottom: '2px' }}
    >
      {children}
    </li>
  );
}
