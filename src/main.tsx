import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installAppHeight } from './utils/viewportHeight';

// Size the app to the visible screen (fixes the installed Android app laying out
// taller than the screen until the first resize).
installAppHeight();

createRoot(document.getElementById('root')!).render(<App />);

// Best effort: a real portrait lock works only where the browser allows it (e.g. installed
// Android app). iPad/iPhone Safari ignore it, so index.html shows a "turn your device" screen.
try {
  const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  o?.lock?.('portrait').catch(() => {});
} catch {
  /* not supported */
}
