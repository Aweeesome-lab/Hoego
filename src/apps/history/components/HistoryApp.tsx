import { useState, useMemo } from 'react';

import HistoryHeader from './HistoryHeader';
import HistoryPanel from './HistoryPanel';

import { useTheme } from '@/hooks';
import { useHistory } from '@/hooks/useHistory';

export default function HistoryApp() {
  const { isDarkMode } = useTheme();
  const { overview, isLoading, error, loadHistory, openFolder } = useHistory();
  const [searchTerm, setSearchTerm] = useState('');

  const handleRefresh = () => void loadHistory();
  const handleOpenFolder = () => void openFolder();

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!overview?.files) return [];
    if (!searchTerm.trim()) return overview.files;

    const term = searchTerm.toLowerCase();
    return overview.files.filter(
      (file) =>
        file.filename.toLowerCase().includes(term) ||
        (file.title && file.title.toLowerCase().includes(term)) ||
        (file.preview && file.preview.toLowerCase().includes(term)) ||
        (file.date && file.date.includes(term))
    );
  }, [overview?.files, searchTerm]);

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? 'bg-gradient-to-b from-gray-800 via-gray-900 to-slate-900'
          : 'bg-gradient-to-b from-gray-100 via-gray-50 to-white'
      } ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
    >
      <div className="max-w-3xl mx-auto px-7 py-9 flex flex-col gap-6">
        <HistoryHeader
          directory={overview?.directory ?? ''}
          onRefresh={handleRefresh}
          onOpenFolder={handleOpenFolder}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isDarkMode={isDarkMode}
        />
        <HistoryPanel
          files={filteredFiles}
          isLoading={isLoading}
          error={error}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
