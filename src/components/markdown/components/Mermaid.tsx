/**
 * Mermaid 다이어그램 컴포넌트 (Lazy Loaded)
 */

'use client';

import { useEffect, useState } from 'react';

import type { MermaidProps } from '../types';

// Mermaid 라이브러리 동적 import
const loadMermaid = () => import('mermaid');

/**
 * Mermaid 다이어그램 렌더러
 */
export function Mermaid({ chart, isDarkMode }: MermaidProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const mermaid = (await loadMermaid()).default;

        // Mermaid 설정
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'ui-monospace, monospace',
        });

        // 다이어그램 렌더링
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        const result = await mermaid.render(id, chart);

        if (!cancelled) {
          setSvg(result.svg);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          console.error('Mermaid rendering error:', err);
        }
      }
    };

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, isDarkMode]);

  if (error) {
    return (
      <div
        className={`
          my-4 p-4 rounded-lg border
          ${isDarkMode
            ? 'bg-red-950/20 border-red-800 text-red-300'
            : 'bg-red-50 border-red-300 text-red-700'
          }
        `}
      >
        <p className="font-semibold">Mermaid Rendering Error:</p>
        <pre className="mt-2 text-sm">{error}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className={`
          my-4 p-8 rounded-lg
          flex items-center justify-center
          ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}
        `}
      >
        <div className="animate-pulse text-sm text-gray-500">
          Loading diagram...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        my-4 p-4 rounded-lg overflow-x-auto
        ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}
      `}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
