import './styles/history.css';
import {
  listHistory,
  openHistoryFolder,
  onHistoryUpdated,
  type HistoryOverview,
  type HistoryFileInfo
} from './lib/tauri';

const directoryElement = document.getElementById('history-directory');
const historyCountElement = document.getElementById('history-count');
const historyEmptyElement = document.getElementById('history-empty');
const historyListElement = document.getElementById('history-files');
const refreshButton = document.getElementById('refresh-history');
const openFolderButton = document.getElementById('open-history-folder');

const renderHistoryOverview = (overview?: HistoryOverview) => {
  if (!overview) return;
  const { directory, files } = overview;

  if (directoryElement) {
    directoryElement.textContent = directory ?? '';
  }

  const list = Array.isArray(files) ? files : [];

  if (historyCountElement) {
    historyCountElement.textContent = list.length > 0 ? `${list.length}개` : '';
  }

  if (historyListElement) {
    historyListElement.innerHTML = '';
  }

  if (list.length === 0) {
    historyEmptyElement?.classList.remove('hidden');
    return;
  }

  historyEmptyElement?.classList.add('hidden');

  list.forEach((fileInfo) => {
    if (!historyListElement) return;

    const item = document.createElement('li');
    item.className = 'history-file';

    const header = document.createElement('header');
    const details = document.createElement('div');
    details.className = 'history-file-details';

    const date = document.createElement('span');
    date.className = 'history-file-date';
    date.textContent = fileInfo.date ?? '';

    const title = document.createElement('p');
    title.className = 'history-file-title';
    title.textContent = fileInfo.title ?? fileInfo.filename ?? '';

    details.append(date, title);

    const actions = document.createElement('div');
    actions.className = 'history-file-actions';

    const copyButton = document.createElement('button');
    copyButton.className = 'history-file-button';
    copyButton.type = 'button';
    copyButton.textContent = '경로 복사';
    copyButton.addEventListener('click', async () => {
      if (!fileInfo.path) return;
      try {
        await navigator.clipboard.writeText(fileInfo.path);
        copyButton.textContent = '복사 완료!';
      } catch (error) {
        if (import.meta.env.DEV) console.error('[otra] 클립보드 복사 실패', error);
        copyButton.textContent = '복사 실패';
      }
      window.setTimeout(() => {
        copyButton.textContent = '경로 복사';
      }, 1200);
    });

    actions.append(copyButton);
    header.append(details, actions);

    item.append(header);

    if ('preview' in fileInfo && fileInfo.preview) {
      const preview = document.createElement('p');
      preview.className = 'history-file-preview';
      preview.textContent = String(fileInfo.preview);
      item.append(preview);
    }

    if (fileInfo.path) {
      const pathElement = document.createElement('p');
      pathElement.className = 'history-file-path';
      pathElement.textContent = fileInfo.path;
      item.append(pathElement);
    }

    historyListElement.append(item);
  });
};

const loadHistory = async () => {
  try {
    const overview = await listHistory();
    renderHistoryOverview(overview);
  } catch (error) {
    if (import.meta.env.DEV) console.error('[otra] 히스토리를 불러오는 중 오류', error);
  }
};

refreshButton?.addEventListener('click', () => {
  void loadHistory();
});

openFolderButton?.addEventListener('click', () => {
  void openHistoryFolder();
});

let disposeHistoryListener: (() => void) | null = null;

onHistoryUpdated((overview) => {
  renderHistoryOverview(overview);
})
  .then((dispose) => {
    disposeHistoryListener = typeof dispose === 'function' ? dispose : null;
  })
  .catch((error) => {
    if (import.meta.env.DEV) console.error('[otra] 히스토리 이벤트 리스너 등록 실패', error);
  });

window.addEventListener('beforeunload', () => {
  try {
    disposeHistoryListener?.();
  } catch (error) {
    if (import.meta.env.DEV) console.error('[otra] 히스토리 이벤트 해제 실패', error);
  }
});

void loadHistory();
