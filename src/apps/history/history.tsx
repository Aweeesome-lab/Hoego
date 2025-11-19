import React from 'react';
import ReactDOM from 'react-dom/client';

import HistoryApp from './components/HistoryApp';
import '@/styles/index.css';

const rootElement = document.getElementById('history-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HistoryApp />
    </React.StrictMode>
  );
}
