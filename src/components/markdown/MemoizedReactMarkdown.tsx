import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { PluggableList } from 'unified';

import type { Components } from 'react-markdown';

interface MemoizedReactMarkdownProps {
  children: string;
  components: Components;
  remarkPlugins?: PluggableList;
  className?: string;
}

/**
 * Memoized wrapper for ReactMarkdown to prevent unnecessary re-renders
 * when the content and components haven't changed.
 */
export const MemoizedReactMarkdown = React.memo(
  function MemoizedReactMarkdown({
    children,
    components,
    remarkPlugins,
    className,
  }: MemoizedReactMarkdownProps) {
    return (
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={components}
        className={className}
      >
        {children}
      </ReactMarkdown>
    );
  },
  // Custom comparison function for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.children === nextProps.children &&
      prevProps.components === nextProps.components &&
      prevProps.remarkPlugins === nextProps.remarkPlugins &&
      prevProps.className === nextProps.className
    );
  }
);
