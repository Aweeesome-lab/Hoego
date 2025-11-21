import React from 'react';
import ReactMarkdown from 'react-markdown';

import type { Components } from 'react-markdown';
import type { PluggableList } from 'unified';

interface MemoizedReactMarkdownProps {
  children: string;
  components: Components;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
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
    rehypePlugins,
    className,
  }: MemoizedReactMarkdownProps) {
    return (
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
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
      prevProps.rehypePlugins === nextProps.rehypePlugins &&
      prevProps.className === nextProps.className
    );
  }
);
