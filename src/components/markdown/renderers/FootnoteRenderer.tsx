import React from 'react';

interface FootnoteRendererProps {
  children: React.ReactNode;
  isDarkMode: boolean;
}

/**
 * Footnote Reference Renderer (superscript link)
 *
 * Renders footnote references like [^1] as superscript links
 */
export const FootnoteReferenceRenderer = React.memo(
  function FootnoteReferenceRenderer({
    children,
    isDarkMode,
    ...props
  }: FootnoteRendererProps & React.HTMLAttributes<HTMLElement>) {
    return (
      <sup
        {...props}
        className={`ml-0.5 ${
          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
        }`}
      >
        <a
          href={`#${props.id}`}
          className={`no-underline hover:underline font-medium ${
            isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}
          aria-label={`Footnote ${children}`}
        >
          {children}
        </a>
      </sup>
    );
  }
);

/**
 * Footnote Definition Renderer (footnote section)
 *
 * Renders the footnote definitions section at the bottom of content
 */
export const FootnoteDefinitionRenderer = React.memo(
  function FootnoteDefinitionRenderer({
    children,
    isDarkMode,
    ...props
  }: FootnoteRendererProps & React.HTMLAttributes<HTMLElement>) {
    return (
      <section
        {...props}
        className={`mt-8 pt-4 border-t text-sm ${
          isDarkMode
            ? 'border-slate-700 text-slate-400'
            : 'border-slate-300 text-slate-600'
        }`}
        aria-label="Footnotes"
      >
        <h2
          className={`text-base font-semibold mb-3 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          Footnotes
        </h2>
        <ol className="space-y-2 pl-0">{children}</ol>
      </section>
    );
  }
);

/**
 * Footnote Item Renderer (individual footnote)
 *
 * Renders each footnote definition as a list item
 */
export const FootnoteItemRenderer = React.memo(function FootnoteItemRenderer({
  children,
  isDarkMode,
  ...props
}: FootnoteRendererProps & React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      {...props}
      className={`text-[13px] leading-relaxed ${
        isDarkMode ? 'text-slate-400' : 'text-slate-600'
      }`}
    >
      {children}
    </li>
  );
});

/**
 * Footnote Back Reference Renderer (return link)
 *
 * Renders the "↩" link to return to the footnote reference
 */
export const FootnoteBackReferenceRenderer = React.memo(
  function FootnoteBackReferenceRenderer({
    children,
    isDarkMode,
    ...props
  }: FootnoteRendererProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
      <a
        {...props}
        className={`ml-2 no-underline hover:underline ${
          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
        }`}
        aria-label="Back to content"
      >
        {children || '↩'}
      </a>
    );
  }
);
