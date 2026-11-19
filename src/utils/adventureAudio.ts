/** Play pre-rendered word mp3s from public/audio/words/. No speechSynthesis. */

/** Bump this when word audio is regenerated so CacheFirst does not keep stale mp3s. */
export const WORD_AUDIO_VERSION = 'v2';

let current: HTMLAudioElement | null = null;

export function wordAudioUrl(word: string): string {
  const safe = word.trim().toLowerCase();
  return `${import.meta.env.BASE_URL}audio/words/${encodeURIComponent(safe)}.mp3?v=${WORD_AUDIO_VERSION}`;
}

export function playWordAudio(word: string): void {
  try {
    if (current) {
      current.pause();
      current.currentTime = 0;
    }
    const audio = new Audio(wordAudioUrl(word));
    current = audio;
    void audio.play().catch((err) => {
      console.warn('Word audio play failed:', word, err);
    });
  } catch (err) {
    console.warn('Word audio error:', word, err);
  }
}

export function stopWordAudio(): void {
  if (current) {
    current.pause();
    current = null;
  }
}
