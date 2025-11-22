import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  isDarkMode: boolean;
}

/**
 * Mermaid Diagram Renderer
 *
 * Renders Mermaid diagrams from code blocks with language "mermaid"
 * Supports various diagram types:
 * - Flowcharts
 * - Sequence diagrams
 * - Class diagrams
 * - State diagrams
 * - ER diagrams
 * - Gantt charts
 * - Pie charts
 * - Git graphs
 *
 * @param code - Mermaid diagram code
 * @param isDarkMode - Dark mode flag
 */
export const MermaidRenderer = React.memo(function MermaidRenderer({
  code,
  isDarkMode,
}: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });

    // Generate unique ID for this diagram
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

    // Render the diagram
    mermaid
      .render(id, code)
      .then((result) => {
        setSvg(result.svg);
        setError(null);
      })
      .catch((err) => {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram');
      });
  }, [code, isDarkMode]);

  if (error) {
    return (
      <div
        className={`my-4 p-4 rounded-lg border ${
          isDarkMode
            ? 'bg-red-950/20 border-red-500/50 text-red-300'
            : 'bg-red-50 border-red-300 text-red-700'
        }`}
        role="alert"
        aria-label="Mermaid diagram error"
      >
        <div className="flex items-start gap-2">
          <span className="font-semibold">Mermaid Diagram Error:</span>
        </div>
        <pre className="mt-2 text-xs font-mono whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`my-4 flex items-center justify-center overflow-x-auto p-4 rounded-lg ${
        isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
      }`}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label="Mermaid diagram"
    />
  );
});
