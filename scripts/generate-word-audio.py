#!/usr/bin/env python3
"""Generate Adventure Mode word mp3s with edge-tts.

Default voice is en-CA-ClaraNeural at a slightly slow rate (-15%).
Reads unique lowercase words from src/data/adventureLexicon.ts and writes
public/audio/words/<word>.mp3. Re-run anytime to regenerate the set.
"""
from __future__ import annotations

import argparse
import asyncio
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
LEXICON = ROOT / "src" / "data" / "adventureLexicon.ts"
OUT_DIR = ROOT / "public" / "audio" / "words"

DEFAULT_VOICE = "en-CA-ClaraNeural"
DEFAULT_RATE = "-15%"
DEFAULT_CONCURRENCY = 6
RETRIES = 4

WORD_RE = re.compile(r'"word":\s*"([a-z]+)"')


def lexicon_words() -> list[str]:
    text = LEXICON.read_text(encoding="utf-8")
    words = sorted(set(WORD_RE.findall(text)))
    if not words:
        raise SystemExit(f"No words found in {LEXICON}")
    return words


async def synthesize(
    word: str,
    dest: Path,
    voice: str,
    rate: str,
    sem: asyncio.Semaphore,
) -> None:
    last_err: Exception | None = None
    tmp = dest.with_name(dest.name + ".tmp")
    for attempt in range(1, RETRIES + 1):
        try:
            async with sem:
                communicate = edge_tts.Communicate(word, voice, rate=rate)
                await communicate.save(str(tmp))
            if not tmp.exists() or tmp.stat().st_size == 0:
                raise RuntimeError("empty output")
            tmp.replace(dest)
            return
        except Exception as exc:  # noqa: BLE001 — retry transient TTS/network errors
            last_err = exc
            if tmp.exists():
                tmp.unlink()
            await asyncio.sleep(0.8 * attempt)
    raise RuntimeError(f"Failed to generate {word!r}: {last_err}")


async def generate(voice: str, rate: str, out: Path, concurrency: int) -> int:
    words = lexicon_words()
    out.mkdir(parents=True, exist_ok=True)
    for leftover in out.glob("*.tmp"):
        leftover.unlink()
    sem = asyncio.Semaphore(concurrency)
    print(f"Generating {len(words)} words with {voice} at rate {rate} → {out}")
    results = await asyncio.gather(
        *[synthesize(word, out / f"{word}.mp3", voice, rate, sem) for word in words],
        return_exceptions=True,
    )
    failures = [(word, result) for word, result in zip(words, results) if isinstance(result, Exception)]
    if failures:
        for word, result in failures:
            print(f"FAIL {word}: {result}", file=sys.stderr)
        return 1

    missing = [
        word
        for word in words
        if not (out / f"{word}.mp3").exists() or (out / f"{word}.mp3").stat().st_size == 0
    ]
    if missing:
        print(f"Missing or empty: {missing}", file=sys.stderr)
        return 1

    extras = sorted(path.stem for path in out.glob("*.mp3") if path.stem not in set(words))
    if extras:
        print(f"Note: {len(extras)} extra mp3s not in lexicon: {', '.join(extras)}")

    sizes = [(out / f"{word}.mp3").stat().st_size for word in words]
    print(f"OK: {len(words)} non-empty mp3s ({min(sizes)}–{max(sizes)} bytes)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="edge-tts voice (default: en-CA-ClaraNeural)")
    parser.add_argument("--rate", default=DEFAULT_RATE, help="speech rate (default: -15%)")
    parser.add_argument("--out", type=Path, default=OUT_DIR, help="output directory")
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY)
    args = parser.parse_args()
    return asyncio.run(generate(args.voice, args.rate, args.out, args.concurrency))


if __name__ == "__main__":
    sys.exit(main())
