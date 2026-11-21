/**
 * Keeps `--app-height` on <html> equal to the height the user can actually see.
 *
 * Why: in the installed Android app (display: fullscreen) with the system nav bar
 * hidden, Chrome can report 100vh/100dvh for the layout *before* it finishes
 * entering fullscreen / hiding bars, so the app was laid out one nav-bar (about a
 * ground strip) taller than the screen until the next viewport resize. We measure
 * window.innerHeight (and visualViewport when it is smaller and not a keyboard or
 * pinch-zoom) and re-measure on every event that can change it, plus a few delayed
 * re-measures to catch bars that hide late. CSS falls back to 100dvh without JS.
 */

const DELAYS_MS = [100, 300, 800, 1500];

function isTextInputFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function measureAppHeight(): number {
  let h = window.innerHeight;
  const vv = window.visualViewport;
  // Use the visual viewport only when it is genuinely the visible area (no zoom, no keyboard).
  if (vv && Math.abs(vv.scale - 1) < 0.01 && !isTextInputFocused() && vv.height > 0 && vv.height < h) {
    h = vv.height;
  }
  return Math.round(h);
}

let last = -1;
let timers: number[] = [];

export function applyAppHeight(): void {
  const h = measureAppHeight();
  if (h > 0 && h !== last) {
    last = h;
    document.documentElement.style.setProperty('--app-height', `${h}px`);
  }
}

/** Re-measure now and a few times over the next ~1.5 s (late bar hiding). */
export function scheduleAppHeight(): void {
  applyAppHeight();
  timers.forEach((t) => clearTimeout(t));
  timers = DELAYS_MS.map((ms) => window.setTimeout(applyAppHeight, ms));
}

export function installAppHeight(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onChange = () => scheduleAppHeight();
  const onVisible = () => {
    if (document.visibilityState === 'visible') scheduleAppHeight();
  };
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  window.addEventListener('pageshow', onChange);
  window.visualViewport?.addEventListener('resize', onChange);
  document.addEventListener('fullscreenchange', onChange);
  document.addEventListener('visibilitychange', onVisible);
  const queries = ['(display-mode: fullscreen)', '(display-mode: standalone)', '(orientation: portrait)'].map((q) =>
    window.matchMedia?.(q)
  );
  queries.forEach((mq) => mq?.addEventListener?.('change', onChange));
  scheduleAppHeight();
  return () => {
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    window.removeEventListener('pageshow', onChange);
    window.visualViewport?.removeEventListener('resize', onChange);
    document.removeEventListener('fullscreenchange', onChange);
    document.removeEventListener('visibilitychange', onVisible);
    queries.forEach((mq) => mq?.removeEventListener?.('change', onChange));
    timers.forEach((t) => clearTimeout(t));
  };
}
