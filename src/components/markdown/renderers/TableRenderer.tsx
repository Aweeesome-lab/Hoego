import React from 'react';

interface TableRendererProps {
  children: React.ReactNode;
  isDarkMode: boolean;
}

/**
 * 테이블 렌더러
 */
export function TableRenderer({
  children,
  isDarkMode,
  ...props
}: TableRendererProps & React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-4 overflow-x-auto">
      <table
        {...props}
        className={`w-full border-collapse text-[13px] ${
          isDarkMode ? 'border-slate-700' : 'border-slate-200'
        }`}
      >
        {children}
      </table>
    </div>
  );
}

/**
 * 테이블 헤더 렌더러
 */
export function TableHeaderRenderer({
  children,
  isDarkMode,
  ...props
}: TableRendererProps & React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}
    >
      {children}
    </thead>
  );
}

/**
 * 테이블 바디 렌더러
 */
export function TableBodyRenderer({
  children,
  ...props
}: Omit<TableRendererProps, 'isDarkMode'> &
  React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props}>{children}</tbody>;
}

/**
 * 테이블 행 렌더러
 */
export function TableRowRenderer({
  children,
  isDarkMode,
  ...props
}: TableRendererProps & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
    >
      {children}
    </tr>
  );
}

/**
 * 테이블 헤더 셀 렌더러
 */
export function TableHeaderCellRenderer({
  children,
  isDarkMode,
  ...props
}: TableRendererProps & React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={`px-4 py-2 text-left font-semibold ${
        isDarkMode ? 'text-slate-200' : 'text-slate-700'
      }`}
    >
      {children}
    </th>
  );
}

/**
 * 테이블 데이터 셀 렌더러
 */
export function TableDataCellRenderer({
  children,
  isDarkMode,
  ...props
}: TableRendererProps & React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={`px-4 py-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
    >
      {children}
    </td>
  );
}
