import React, { useState } from 'react';
import { X, Check, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import {
  CustomGameSettings,
  CUSTOM_OPTIONS,
  DEFAULT_CUSTOM_SETTINGS,
} from '../utils/customSettings';

interface SettingsModalProps {
  /** Saved custom settings, or null when none are saved yet. */
  saved: CustomGameSettings | null;
  onSave: (next: CustomGameSettings) => void;
  /** Forget saved settings (removes the Custom difficulty). */
  onReset: () => void;
  onClose: () => void;
}

interface SegmentedProps<T> {
  label: string;
  hint?: string;
  options: { label: string; val: T }[];
  value: T;
  onChange: (val: T) => void;
}

function Segmented<T extends string | number>({ label, hint, options, value, onChange }: SegmentedProps<T>) {
  const cols =
    options.length >= 5
      ? 'grid-cols-3 sm:grid-cols-5'
      : options.length === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-3';
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm font-display font-black text-white">{label}</span>
        {hint && <span className="text-[11px] text-slate-400 font-medium truncate">{hint}</span>}
      </div>
      <div className={`grid ${cols} gap-1.5`}>
        {options.map((o) => {
          const active = o.val === value;
          return (
            <button
              key={String(o.val)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.val)}
              className={`min-h-[44px] px-2 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                active
                  ? 'bg-fuchsia-500 border-fuchsia-300 text-white shadow-md shadow-fuchsia-500/20'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {active && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
              <span className="truncate">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Home > Settings: the player's own gameplay settings, used by the Custom difficulty. */
export const SettingsModal: React.FC<SettingsModalProps> = ({ saved, onSave, onReset, onClose }) => {
  const [draft, setDraft] = useState<CustomGameSettings>(() => saved ?? DEFAULT_CUSTOM_SETTINGS);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const set = <K extends keyof CustomGameSettings>(key: K, val: CustomGameSettings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const handleReset = () => {
    onReset();
    setDraft(DEFAULT_CUSTOM_SETTINGS);
    setConfirmReset(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4 bg-slate-950/85 backdrop-blur-md select-none text-slate-100 animate-fade-in">
      <div className="w-full sm:max-w-lg bg-slate-900 sm:border-2 border-slate-700/80 sm:rounded-3xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">Settings</h2>
              <span className="text-xs font-semibold text-fuchsia-300/90 block truncate">
                Save to play them as the <strong>Custom</strong> difficulty
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4">
          <Segmented
            label="Falling speed"
            options={CUSTOM_OPTIONS.fallSpeed}
            value={draft.fallSpeed}
            onChange={(v) => set('fallSpeed', v)}
          />
          <Segmented
            label="Letters falling at once"
            hint="more on bigger screens"
            options={CUSTOM_OPTIONS.lettersAtOnce}
            value={draft.lettersAtOnce}
            onChange={(v) => set('lettersAtOnce', v)}
          />
          <Segmented
            label="Get faster after each word"
            options={CUSTOM_OPTIONS.speedUpPct}
            value={draft.speedUpPct}
            onChange={(v) => set('speedUpPct', v)}
          />
          <Segmented
            label="Room before the line"
            options={CUSTOM_OPTIONS.ceilingHeight}
            value={draft.ceilingHeight}
            onChange={(v) => set('ceilingHeight', v)}
          />
          <Segmented
            label="Letter size"
            options={CUSTOM_OPTIONS.tileRadius}
            value={draft.tileRadius}
            onChange={(v) => set('tileRadius', v)}
          />
          <Segmented
            label="Play area"
            options={CUSTOM_OPTIONS.wallWidthPct}
            value={draft.wallWidthPct}
            onChange={(v) => set('wallWidthPct', v)}
          />
          <p className="text-[11px] text-slate-500 font-medium">
            Round times are set per mode (Quick Play, Solo, Team), not here.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {confirmReset ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-rose-400 font-bold">Reset to defaults?</span>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                Yes, reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={saved ? 'Forget your settings and remove the Custom difficulty' : 'Set every control back to default'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to defaults</span>
            </button>
          )}

          {!confirmReset && (
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="min-h-[48px] px-5 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-display font-black text-sm flex items-center gap-2 shadow-lg shadow-fuchsia-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
