import {
  Bold,
  Italic,
  Link,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  CheckSquare,
} from 'lucide-react';
import React from 'react';

interface MarkdownToolbarProps {
  onFormat: (before: string, after: string, placeholder?: string) => void;
  isDarkMode?: boolean;
}

/**
 * Markdown Editing Toolbar
 *
 * Provides quick access buttons for common markdown formatting:
 * - Bold, Italic, Link, Code
 * - Headings (H1, H2, H3)
 * - Lists (unordered, ordered, task list)
 * - Blockquote, Horizontal Rule
 *
 * Each button inserts the appropriate markdown syntax at cursor position
 * or wraps the selected text.
 */
export const MarkdownToolbar = React.memo(function MarkdownToolbar({
  onFormat,
  isDarkMode = false,
}: MarkdownToolbarProps) {
  const buttonBaseClass = `p-2 rounded-md transition-all duration-150 hover:scale-105 active:scale-95 ${
    isDarkMode
      ? 'hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white'
      : 'hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-900'
  }`;

  const separatorClass = `w-px h-6 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`;

  const buttons = [
    // Text formatting
    {
      icon: Bold,
      label: 'Bold (Cmd/Ctrl+B)',
      action: () => onFormat('**', '**', 'bold text'),
    },
    {
      icon: Italic,
      label: 'Italic (Cmd/Ctrl+I)',
      action: () => onFormat('*', '*', 'italic text'),
    },
    {
      icon: Code,
      label: 'Inline Code',
      action: () => onFormat('`', '`', 'code'),
    },
    { separator: true },

    // Headings
    {
      icon: Heading1,
      label: 'Heading 1',
      action: () => onFormat('# ', '', 'Heading'),
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      action: () => onFormat('## ', '', 'Heading'),
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      action: () => onFormat('### ', '', 'Heading'),
    },
    { separator: true },

    // Link
    {
      icon: Link,
      label: 'Link (Cmd/Ctrl+K)',
      action: () => onFormat('[', '](url)', 'link text'),
    },
    { separator: true },

    // Lists
    {
      icon: List,
      label: 'Unordered List',
      action: () => onFormat('- ', '', 'list item'),
    },
    {
      icon: ListOrdered,
      label: 'Ordered List',
      action: () => onFormat('1. ', '', 'list item'),
    },
    {
      icon: CheckSquare,
      label: 'Task List',
      action: () => onFormat('- [ ] ', '', 'task item'),
    },
    { separator: true },

    // Blockquote & HR
    {
      icon: Quote,
      label: 'Blockquote',
      action: () => onFormat('> ', '', 'quote'),
    },
    {
      icon: Minus,
      label: 'Horizontal Rule',
      action: () => onFormat('\n---\n', '', ''),
    },
  ];

  return (
    <div
      className={`flex items-center gap-1 px-3 py-2 border-b ${
        isDarkMode
          ? 'bg-slate-900/50 border-slate-700'
          : 'bg-white/50 border-slate-200'
      }`}
      role="toolbar"
      aria-label="Markdown formatting toolbar"
    >
      {buttons.map((button, index) => {
        if ('separator' in button && button.separator) {
          return <div key={`sep-${index}`} className={separatorClass} />;
        }

        const Icon = button.icon!;
        return (
          <button
            key={index}
            onClick={button.action}
            className={buttonBaseClass}
            title={button.label}
            aria-label={button.label}
            type="button"
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
});
