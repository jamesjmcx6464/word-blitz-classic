/**
 * Installed-app nav bar control (Android).
 *
 * A web app cannot show or hide the system nav bar directly. The OS keeps it hidden
 * the whole time when the manifest asks for display: fullscreen, so it stayed hidden
 * while the keyboard was open and left an empty bar under the keyboard. Instead the
 * manifest uses standalone (bars visible) and we hide them with the Fullscreen API:
 * - on any tap, enter fullscreen (nav bar hides);
 * - when a text field gets focus (keyboard opens), leave fullscreen so the nav bar shows;
 * - when the field loses focus (keyboard closed), go back to fullscreen. If the browser
 *   needs a tap for that, the next tap does it.
 * Only runs in the installed app (display-mode standalone/fullscreen), never in a browser tab.
 */

function isInstalled(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    false
  );
}

function isTextField(el: EventTarget | null): boolean {
  const e = el as HTMLElement | null;
  if (!e || !e.tagName) return false;
  if (e.tagName === 'TEXTAREA' || e.isContentEditable) return true;
  if (e.tagName !== 'INPUT') return false;
  const t = (e as HTMLInputElement).type;
  return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file', 'image'].includes(t);
}

function enter(): void {
  if (!document.fullscreenEnabled || document.fullscreenElement) return;
  if (isTextField(document.activeElement)) return;
  document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
}

function leave(): void {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}

export function installImmersive(): void {
  if (typeof window === 'undefined' || !isInstalled() || !document.fullscreenEnabled) return;
  // Taps count as the user gesture the browser needs before going fullscreen.
  document.addEventListener('pointerup', () => enter(), true);
  document.addEventListener('focusin', (e) => {
    if (isTextField(e.target)) leave();
  });
  document.addEventListener('focusout', () => {
    // Wait for focus to settle (moving between fields should not flicker).
    window.setTimeout(enter, 250);
  });
}
