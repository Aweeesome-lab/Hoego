import HistoryFileItem from './HistoryFileItem';

import type { HistoryFileInfo } from '@/types/tauri-commands';

interface HistoryFileListProps {
  files: HistoryFileInfo[];
  isDarkMode: boolean;
}

export default function HistoryFileList({
  files,
  isDarkMode,
}: HistoryFileListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-4">
      {files.map((file, index) => (
        <HistoryFileItem
          key={`${file.path}-${index}`}
          file={file}
          isDarkMode={isDarkMode}
        />
      ))}
    </ul>
  );
}
