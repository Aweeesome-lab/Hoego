// Entry selector for multi-window app using a single HTML.
// Decides which bundle to load based on URL hash/query.

const isHistoryMode = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    if (window.location.hash === '#history') return true;
    const qp = new URLSearchParams(window.location.search);
    return qp.get('view') === 'history';
  } catch {
    return false;
  }
};

async function bootstrap() {
  if (isHistoryMode()) {
    // Inject history HTML skeleton expected by src/history.ts
    document.body.innerHTML = `
    <div id="history-root">
      <div class="history-container">
        <header class="history-header">
          <div>
            <h1>데일리 트래킹</h1>
            <p id="history-directory" class="history-subtitle"></p>
          </div>
          <div class="header-actions">
            <button id="open-history-folder" class="ghost-button">폴더 열기</button>
            <button id="refresh-history" class="ghost-button">새로고침</button>
          </div>
        </header>

        <section class="panel">
          <div class="panel-header">
            <h2>기록 목록</h2>
            <span id="history-count" class="history-count"></span>
          </div>
          <div id="history-empty" class="empty-state">
            아직 저장된 Markdown 기록이 없습니다.
          </div>
          <ul id="history-files" class="history-file-list"></ul>
        </section>
      </div>
    </div>`;

    await import('./history');
  } else {
    // Ensure React root exists and boot the overlay app
    if (!document.getElementById('root')) {
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
    await import('./main.tsx');
  }
}

void bootstrap();

