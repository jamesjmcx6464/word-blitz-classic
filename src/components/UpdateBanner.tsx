import React, { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

const CHECK_INTERVAL_MS = 2 * 60 * 1000;
const UPDATE_WAIT_MS = 8000;

interface UpdateBannerProps {
  /** When false (an active arcade or Adventure round), the banner stays hidden even if an update is waiting. */
  allowed: boolean;
}

function versionUrl(): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}version.json?t=${Date.now()}`;
}

async function fetchRemoteVersion(signal?: AbortSignal): Promise<string | null> {
  const res = await fetch(versionUrl(), { cache: 'no-store', signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { version?: string };
  return data?.version ?? null;
}

function waitForWaitingOrActivated(
  registration: ServiceWorkerRegistration,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      resolve(ok);
    };

    const inspect = (worker: ServiceWorker | null) => {
      if (registration.waiting) {
        finish(true);
        return;
      }
      if (!worker) return;
      if (worker.state === 'activated') {
        finish(true);
        return;
      }
      const onState = () => {
        if (worker.state === 'installed' && registration.waiting) finish(true);
        if (worker.state === 'activated') finish(true);
      };
      worker.addEventListener('statechange', onState);
    };

    inspect(registration.waiting);
    inspect(registration.installing);
    const pollId = window.setInterval(() => {
      inspect(registration.waiting);
      inspect(registration.installing);
    }, 200);
    const timeoutId = window.setTimeout(() => finish(false), timeoutMs);
  });
}

async function forceRefreshToNewVersion(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  window.location.reload();
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ allowed }) => {
  const [dismissed, setDismissed] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;
    },
  });

  useEffect(() => {
    let cancelled = false;
    let controller = new AbortController();

    const runVersionCheck = async () => {
      controller.abort();
      controller = new AbortController();
      try {
        const version = await fetchRemoteVersion(controller.signal);
        if (cancelled || controller.signal.aborted) return;
        if (version && version !== __APP_VERSION__) {
          setRemoteVersion(version);
          void registrationRef.current?.update();
        } else if (version) {
          setRemoteVersion(null);
        }
      } catch {
        /* offline or missing — keep any SW-based prompt */
      }
    };

    const check = () => {
      void runVersionCheck();
      void registrationRef.current?.update();
    };

    check();
    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const versionMismatch = remoteVersion != null && remoteVersion !== __APP_VERSION__;
  const updateReady = needRefresh || versionMismatch;

  const handleUpdate = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      const registration =
        registrationRef.current ??
        (typeof navigator !== 'undefined' && 'serviceWorker' in navigator
          ? ((await navigator.serviceWorker.getRegistration()) ?? null)
          : null);

      if (registration?.waiting) {
        await updateServiceWorker(true);
        return;
      }

      if (registration) {
        try {
          await registration.update();
        } catch {
          /* wait / fall back below */
        }
        const ready = await waitForWaitingOrActivated(registration, UPDATE_WAIT_MS);
        if (ready) {
          if (registration.waiting) {
            await updateServiceWorker(true);
            return;
          }
          window.location.reload();
          return;
        }
      }

      await forceRefreshToNewVersion();
    } catch {
      try {
        await forceRefreshToNewVersion();
      } catch {
        window.location.reload();
      }
    }
  };

  if (!allowed || !updateReady || dismissed) return null;

  const versionLine =
    remoteVersion != null ? `v${__APP_VERSION__} → v${remoteVersion}` : null;

  return (
    <div
      data-update-banner="true"
      className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-amber-400/50 bg-slate-900/95 p-3 shadow-2xl shadow-slate-950/80 backdrop-blur-md text-slate-100"
      role="status"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/40">
          <RefreshCw className={`h-5 w-5 text-amber-400 ${updating ? 'animate-spin' : ''}`} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-display font-black text-sm sm:text-base leading-tight">
            Update available
          </p>
          {versionLine && (
            <p className="mt-0.5 font-mono text-[11px] text-slate-400 truncate">
              {versionLine}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            disabled={updating}
            onClick={() => setDismissed(true)}
            className="min-h-[40px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-600/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
          >
            Later
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={() => void handleUpdate()}
            className="min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-70"
          >
            {updating ? 'Updating…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};
