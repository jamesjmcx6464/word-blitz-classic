import { useEffect, useState } from 'react';

/**
 * End-of-round screens: false for the first `ms` after mount so a tap that was
 * meant for the game board can't land on Replay / Next. Pair with data-armed on
 * the screen root (see index.css).
 */
export function useTapReady(ms = 600): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return ready;
}
