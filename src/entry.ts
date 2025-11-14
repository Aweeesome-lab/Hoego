// Entry selector for multi-window app using a single HTML.
// Decides which bundle to load based on URL hash.

type WindowMode = 'main' | 'history' | 'settings';

const getWindowMode = (): WindowMode => {
  try {
    if (typeof window === 'undefined') return 'main';
    const hash = window.location.hash;

    if (hash === '#history') return 'history';
    if (hash === '#settings') return 'settings';

    return 'main';
  } catch {
    return 'main';
  }
};

async function bootstrap() {
  const mode = getWindowMode();

  switch (mode) {
    case 'history': {
      // Create React root for history window
      if (!document.getElementById('history-root')) {
        const root = document.createElement('div');
        root.id = 'history-root';
        document.body.appendChild(root);
      }
      await import('./apps/history/history');
      break;
    }

    case 'settings': {
      // Create React root for settings window
      if (!document.getElementById('settings-root')) {
        const root = document.createElement('div');
        root.id = 'settings-root';
        document.body.appendChild(root);
      }
      await import('./apps/settings/settings');
      break;
    }

    default: {
      // Main overlay app
      if (!document.getElementById('root')) {
        const root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);
      }
      await import('./apps/main/main');
      break;
    }
  }
}

void bootstrap();
