import { invoke } from '@tauri-apps/api/tauri';
import { ExternalLink } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { LinkMetadata } from '../../types/tauri-commands';

interface LinkPreviewCardProps {
  href: string;
  children?: React.ReactNode;
  isDarkMode: boolean;
}

/**
 * LinkPreviewCard component
 * Displays a rich preview card for links with metadata
 */
export function LinkPreviewCard({
  href,
  children,
  isDarkMode,
}: LinkPreviewCardProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Skip if not a valid HTTP(S) URL
    if (!href || !href.match(/^https?:\/\//)) {
      setLoading(false);
      setError(true);
      return;
    }

    // Fetch metadata
    fetchLinkMetadata(href)
      .then((data) => {
        setMetadata(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [href]);

  // If loading or error, show simple link
  if (loading || error || !metadata) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-500 underline decoration-sky-500/50 underline-offset-2 hover:text-sky-400 break-all inline-flex items-center gap-1"
      >
        {children}
        <ExternalLink className="h-3 w-3 inline" />
      </a>
    );
  }

  // Show rich preview card
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`my-4 block overflow-hidden rounded-lg border transition-all hover:shadow-lg no-underline group ${
        isDarkMode
          ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 shadow-sm'
          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row min-h-[120px]">
        {/* Image preview (if available) */}
        {metadata.image && (
          <div
            className={`flex-shrink-0 sm:w-40 h-32 sm:h-auto overflow-hidden ${
              isDarkMode ? 'bg-white/5' : 'bg-slate-100'
            }`}
          >
            <img
              src={metadata.image}
              alt={metadata.title || 'Link preview'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // Hide image on error
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4 min-w-0">
          <div className="space-y-2">
            {/* Site name / favicon */}
            {(metadata.site_name || metadata.favicon) && (
              <div className="flex items-center gap-2">
                {metadata.favicon && (
                  <img
                    src={metadata.favicon}
                    alt=""
                    className="h-4 w-4 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span
                  className={`text-xs font-medium truncate ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {metadata.site_name || new URL(href).hostname}
                </span>
              </div>
            )}

            {/* Title */}
            {metadata.title && (
              <h3
                className={`text-sm font-semibold line-clamp-2 leading-snug ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                {metadata.title}
              </h3>
            )}

            {/* Description */}
            {metadata.description && (
              <p
                className={`text-xs line-clamp-2 leading-relaxed ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {metadata.description}
              </p>
            )}
          </div>

          {/* URL */}
          <div className="flex items-center gap-1.5 text-xs mt-3 pt-3 border-t border-slate-200/10">
            <span
              className={`truncate font-medium ${
                isDarkMode ? 'text-sky-400' : 'text-sky-600'
              }`}
            >
              {new URL(href).hostname}
            </span>
            <ExternalLink
              className={`h-3 w-3 flex-shrink-0 ${
                isDarkMode ? 'text-sky-400' : 'text-sky-600'
              }`}
            />
          </div>
        </div>
      </div>
    </a>
  );
}

/**
 * Fetch link metadata using Tauri backend
 */
async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    const metadata = await invoke<LinkMetadata>('fetch_link_metadata', { url });
    return metadata;
  } catch (error) {
    console.error('Failed to fetch link metadata:', error);
    throw new Error('Failed to fetch link metadata');
  }
}
