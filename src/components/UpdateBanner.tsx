import React, { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

interface UpdateBannerProps {
  /** When false (an active round), the banner stays hidden even if an update is waiting. */
  allowed: boolean;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ allowed }) => {
  const [dismissed, setDismissed] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;
    },
  });

  useEffect(() => {
    const check = () => {
      void registrationRef.current?.update();
    };

    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!needRefresh) {
      setRemoteVersion(null);
      return;
    }

    const url = `${import.meta.env.BASE_URL}version.json`;
    const controller = new AbortController();
    fetch(url, { cache: 'no-store', signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { version?: string } | null) => {
        if (data?.version && data.version !== __APP_VERSION__) {
          setRemoteVersion(data.version);
        }
      })
      .catch(() => {
        /* offline or missing — just hide the version line */
      });

    return () => controller.abort();
  }, [needRefresh]);

  if (!allowed || !needRefresh || dismissed) return null;

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
          <RefreshCw className="h-5 w-5 text-amber-400" />
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
            onClick={() => setDismissed(true)}
            className="min-h-[40px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-600/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};
