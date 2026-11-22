import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export const TIP_LINKS = [
  { amount: 2, label: '$2 — Data bytes for the bots', url: 'https://paypal.me/jjmurray64/2' },
  { amount: 5, label: '$5 — Buy JMCX a coffee', url: 'https://paypal.me/jjmurray64/5' },
] as const;

type Tip = (typeof TIP_LINKS)[number];

function newQuestion(): { a: number; b: number } {
  const a = 3 + Math.floor(Math.random() * 7); // 3..9
  const b = 3 + Math.floor(Math.random() * 7);
  return { a, b };
}

/** Opens an outside link in a new tab (the installed app hands it to the browser). No tracking. */
function openExternal(url: string): void {
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) w.opener = null;
}

interface CreditsModalProps {
  onClose: () => void;
}

/** Credits + optional tip jar, behind a simple grown-ups math gate. */
export const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => {
  const [tip, setTip] = useState<Tip | null>(null);
  const [q, setQ] = useState(newQuestion);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tip) inputRef.current?.focus();
  }, [tip, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = (t: Tip) => {
    setTip(t);
    setQ(newQuestion());
    setAnswer('');
    setWrong(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tip) return;
    if (Number(answer.trim()) === q.a + q.b) {
      openExternal(tip.url);
      setTip(null);
      setAnswer('');
      setWrong(false);
    } else {
      setWrong(true);
      setAnswer('');
      setQ(newQuestion());
    }
  };

  return (
    <div
      data-testid="credits-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
      className="game-over-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md select-none animate-fade-in overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="game-over-card relative w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col text-slate-100 overflow-y-auto min-h-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close credits"
          className="absolute top-2.5 right-2.5 min-h-[40px] min-w-[40px] rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="credits-title" className="font-display font-black text-xl text-white pr-12 leading-tight">
          Word Blitz Classic
        </h2>

        <div data-testid="credits-team" className="mt-2 space-y-1 text-[13px] leading-tight">
          <div>
            <span className="font-bold text-white">JMCX</span>
            <span className="block text-[11px] text-slate-400">Creative Director, CEO of JMCX</span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90 pt-0.5">Built with Grok Bot</div>
          <div className="pl-2.5 border-l-2 border-slate-700">
            <span className="font-bold text-white">Bean Counter</span>
            <span className="block text-[11px] text-slate-400">AI Helper Wrangler, Token Saver, Team Coordinator</span>
          </div>
          <div className="pl-2.5 border-l-2 border-slate-700">
            <span className="font-bold text-white">Word Blitz Classic</span>
            <span className="block text-[11px] text-slate-400">Lead Developer, Adventure Mode Designer, Playtest Note-Taker</span>
          </div>
        </div>

        <ul className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-1 text-[12px] leading-snug text-slate-300">
          <li>
            <span className="font-bold text-slate-100">Voice:</span> Microsoft Edge neural voices (Clara, Emma) via
            edge-tts
          </li>
          <li>
            <span className="font-bold text-slate-100">Words:</span> ENABLE word list; Dolch &amp; Fry sight words;
            Adventure words from JMCX's classroom lists
          </li>
          <li>
            <span className="font-bold text-slate-100">Emoji:</span> your device's system emoji
          </li>
          <li>
            <span className="font-bold text-slate-100">Fonts &amp; icons:</span> Outfit, Plus Jakarta Sans, Lucide
          </li>
        </ul>

        <div className="mt-3 pt-2.5 border-t border-slate-800">
          <h3 className="font-display font-black text-base text-amber-300">Support Word Blitz</h3>
          {!tip ? (
            <div className="mt-2 flex flex-col gap-2">
              {TIP_LINKS.map((t) => (
                <button
                  key={t.amount}
                  type="button"
                  data-testid={`tip-${t.amount}`}
                  onClick={() => pick(t)}
                  className="min-h-[44px] px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm text-left cursor-pointer active:scale-[0.98] transition-transform"
                >
                  {t.label}
                </button>
              ))}
              <p className="text-xs text-slate-500">Opens PayPal. Optional, and always appreciated.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-2 flex flex-col gap-2" data-testid="grownup-gate">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ask a grown-up</p>
              <label className="flex items-center gap-2 text-lg font-black text-white">
                <span data-testid="gate-question">
                  {q.a} + {q.b} =
                </span>
                <input
                  ref={inputRef}
                  data-testid="gate-answer"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  maxLength={3}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
                  aria-label={`What is ${q.a} plus ${q.b}?`}
                  className="w-20 min-h-[44px] px-3 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-amber-400 outline-none text-center select-text"
                />
              </label>
              {wrong && (
                <p data-testid="gate-wrong" className="text-xs text-rose-300">
                  Not quite. Try this one.
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  data-testid="gate-submit"
                  className="flex-1 min-h-[44px] rounded-2xl bg-amber-400 text-slate-950 font-black text-sm cursor-pointer active:scale-[0.98]"
                >
                  Continue to PayPal
                </button>
                <button
                  type="button"
                  onClick={() => setTip(null)}
                  className="min-h-[44px] px-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm cursor-pointer"
                >
                  Back
                </button>
              </div>
              <p className="text-[11px] text-slate-500">{tip.label}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
