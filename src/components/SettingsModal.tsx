import React, { useState } from 'react';
import { X, Check, RotateCcw, SlidersHorizontal, BookOpen } from 'lucide-react';
import {
  CustomGameSettings,
  CUSTOM_OPTIONS,
  DEFAULT_CUSTOM_SETTINGS,
} from '../utils/customSettings';
import {
  LetterDistributionSettings,
  DEFAULT_LETTER_DISTRIBUTION,
  PRESET_META,
  LETTER_PRESET_IDS,
  LetterPresetId,
  SOUND_GROUPS,
  SOUND_FOCUS,
  SoundFocusId,
  isStandardLetterMix,
  toggleSound,
} from '../utils/letterDistributions';
import { soundFocusSamples } from '../data/phonicsLists';

interface SettingsModalProps {
  /** Saved custom settings, or null when none are saved yet. */
  saved: CustomGameSettings | null;
  onSave: (next: CustomGameSettings) => void;
  /** Forget saved settings (removes the Custom difficulty). */
  onReset: () => void;
  onClose: () => void;
  letterDist: LetterDistributionSettings;
  onChangeLetterDist: (next: LetterDistributionSettings) => void;
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

type SettingsTab = 'game' | 'letters';

/** Home > Settings: gameplay (Custom difficulty) plus letter mix used in every difficulty. */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  saved,
  onSave,
  onReset,
  onClose,
  letterDist,
  onChangeLetterDist,
}) => {
  const [tab, setTab] = useState<SettingsTab>('game');
  const [draft, setDraft] = useState<CustomGameSettings>(() => saved ?? DEFAULT_CUSTOM_SETTINGS);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Auto-save: every change is stored right away (no Save button).
  const set = <K extends keyof CustomGameSettings>(key: K, val: CustomGameSettings[K]) => {
    const next = { ...draft, [key]: val };
    setDraft(next);
    onSave(next);
  };

  const handleReset = () => {
    onReset();
    setDraft(DEFAULT_CUSTOM_SETTINGS);
    setConfirmReset(false);
  };

  const selectPreset = (preset: LetterPresetId) => {
    onChangeLetterDist({ preset, sounds: [] });
  };

  // Multi-select: each chip toggles its focus on or off.
  const selectSound = (sound: SoundFocusId) => {
    onChangeLetterDist(toggleSound(letterDist, sound));
  };

  const resetLetters = () => {
    onChangeLetterDist({ ...DEFAULT_LETTER_DISTRIBUTION });
  };

  const activeSounds = letterDist.sounds.map((id) => SOUND_FOCUS[id]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4 bg-slate-950/85 backdrop-blur-md select-none text-slate-100 animate-fade-in">
      <div className="w-full sm:max-w-xl bg-slate-900 sm:border-2 border-slate-700/80 sm:rounded-3xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center text-fuchsia-300 shrink-0">
              {tab === 'letters' ? <BookOpen className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">Settings</h2>
              <span className="text-xs font-semibold text-fuchsia-300/90 block truncate">
                {tab === 'game' ? (
                  <>
                    Saved as you go, played as the <strong>Custom</strong> difficulty
                  </>
                ) : (
                  <>Used in every difficulty, saved as you tap</>
                )}
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

        {/* Tabs */}
        <div className="px-4 sm:px-5 pt-3 shrink-0" role="tablist" aria-label="Settings sections">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            {(
              [
                { id: 'game' as const, label: 'Game', icon: SlidersHorizontal },
                { id: 'letters' as const, label: 'Letters', icon: BookOpen },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(t.id);
                    setConfirmReset(false);
                  }}
                  className={`min-h-[44px] rounded-xl font-display font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
                      : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-4">
          {tab === 'game' ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-[11px] text-slate-300 font-medium leading-snug px-0.5">
                Group words charge the floor multiplier (up to 4×), and longer words charge more. Typos and words outside the group drain it.
              </p>
              <section>
                <h3 className="text-sm font-display font-black text-white mb-1">Presets</h3>
                <p className="text-[11px] text-slate-400 font-medium mb-2.5">
                  Beginner-friendly mixes based on words kids learn in class.
                </p>
                <div role="radiogroup" aria-label="Letter mix presets" className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {LETTER_PRESET_IDS.map((id) => {
                    const meta = PRESET_META[id];
                    const active = letterDist.sounds.length === 0 && letterDist.preset === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => selectPreset(id)}
                        className={`min-h-[52px] px-3 py-2 rounded-xl border-2 text-left transition-all cursor-pointer active:scale-[0.99] ${
                          active
                            ? 'bg-fuchsia-500 border-fuchsia-300 text-white shadow-md shadow-fuchsia-500/20'
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {active && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                          <span className="text-sm font-display font-black leading-tight">{meta.label}</span>
                        </div>
                        <p className={`text-[11px] font-medium mt-0.5 leading-snug ${active ? 'text-fuchsia-50/90' : 'text-slate-400'}`}>
                          {meta.blurb}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-display font-black text-white mb-1">Sound focus</h3>
                <p className="text-[11px] text-slate-400 font-medium mb-2.5">
                  Pick one or more sounds. Letters come from short words with those sounds.
                </p>
                <div className="space-y-3">
                  {SOUND_GROUPS.map((group) => (
                    <div key={group.label}>
                      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                        {group.label}
                      </div>
                      <div role="group" aria-label={group.label} className="flex flex-wrap gap-1.5">
                        {group.ids.map((id) => {
                          const def = SOUND_FOCUS[id];
                          const active = letterDist.sounds.includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              role="checkbox"
                              aria-checked={active}
                              data-testid={`sound-chip-${id}`}
                              onClick={() => selectSound(id)}
                              className={`min-h-[40px] min-w-[44px] px-2.5 rounded-xl border-2 font-display font-black text-sm transition-all cursor-pointer active:scale-95 ${
                                active
                                  ? 'bg-sky-500 border-sky-300 text-white shadow-md shadow-sky-500/20'
                                  : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                              }`}
                            >
                              {def.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {activeSounds.length > 0 && (
                  <div data-testid="sound-samples" className="mt-3 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-400/30 space-y-2">
                    {activeSounds.map((def) => (
                      <div key={def.id}>
                        <div className="text-[11px] font-bold text-sky-300 mb-0.5">Try words with {def.label}</div>
                        <p className="text-sm font-bold text-white tracking-wide leading-snug">
                          {soundFocusSamples(def.id).map((w) => w.toLowerCase()).join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {tab === 'letters' ? (
            <>
              <button
                type="button"
                onClick={resetLetters}
                disabled={isStandardLetterMix(letterDist)}
                className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 disabled:text-slate-600 disabled:hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Use Standard</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium">Saved as you go</span>
            </>
          ) : confirmReset ? (
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
            <>
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                title={saved ? 'Forget your settings and remove the Custom difficulty' : 'Set every control back to default'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to defaults</span>
              </button>
              <span className="text-[11px] text-slate-500 font-medium">{saved ? 'Saved as you go' : 'Changes save automatically'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
