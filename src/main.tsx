import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

registerSW({immediate: true});

createRoot(document.getElementById('root')!).render(<App />);

// Best effort: a real portrait lock works only where the browser allows it (e.g. installed
// Android app). iPad/iPhone Safari ignore it, so index.html shows a "turn your device" screen.
try {
  const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  o?.lock?.('portrait').catch(() => {});
} catch {
  /* not supported */
}
