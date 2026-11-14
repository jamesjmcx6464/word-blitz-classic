#!/usr/bin/env python3
"""Rebuild src/data/words.json from auditable source lists.

Inputs (scripts/dictionary/):
  two-letter-allowlist.txt  — the only 2-letter words allowed in play
  three-letter-remove.txt   — rare 3-letter words dropped after sanity review
  three-letter-keep.txt     — familiar Zipf<3.0 threes that were kept (documentation)
  blocklist.rot13           — slurs / strong profanity / sexual-vulgar terms (rot13)
  enable-9plus-zipf2.txt    — ENABLE length 9+ with wordfreq Zipf >= 2.0
  additions.txt             — holidays, places, modern words, audit leftovers

The existing src/data/words.json is the 2–8 letter base (ENABLE family plus
a small supplement). This script strips blocked/junk short words from it,
then unions the 9+ list and the classroom additions. It is idempotent.

Runtime dictionary.ts still merges countries, professions, months, and days,
and also enforces the 2-letter allowlist so splits like AU PAIR cannot
re-inject AU.
"""
from __future__ import annotations

import codecs
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(__file__).resolve().parent / "dictionary"
WORDS_JSON = ROOT / "src/data/words.json"


def load_word_list(path: Path, *, rot13: bool = False) -> list[str]:
    text = path.read_text(encoding="utf-8")
    if rot13:
        body = "\n".join(ln for ln in text.splitlines() if not ln.startswith("#"))
        text = codecs.decode(body, "rot_13")
    out: list[str] = []
    seen: set[str] = set()
    for ln in text.splitlines():
        ln = ln.strip().upper()
        if not ln or ln.startswith("#"):
            continue
        if not re.fullmatch(r"[A-Z]+", ln):
            continue
        if ln not in seen:
            seen.add(ln)
            out.append(ln)
    return out


def main() -> int:
    allow2 = set(load_word_list(SRC / "two-letter-allowlist.txt"))
    remove3 = set(load_word_list(SRC / "three-letter-remove.txt"))
    block = set(load_word_list(SRC / "blocklist.rot13", rot13=True))
    enable_long = load_word_list(SRC / "enable-9plus-zipf2.txt")
    additions = load_word_list(SRC / "additions.txt")

    raw = json.loads(WORDS_JSON.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        print("words.json is not a list", file=sys.stderr)
        return 1
    previous = {str(w).upper().strip() for w in raw}

    # Start from whatever is already in words.json (first run: 2–8 letter base;
    # later runs: the full generated list). Then apply filters + unions.
    words = set(previous)

    removed_block = sorted(w for w in words if w in block)
    removed_2 = sorted(w for w in words if len(w) == 2 and w not in allow2)
    removed_3 = sorted(w for w in words if w in remove3)

    words -= block
    words = {w for w in words if not (len(w) == 2 and w not in allow2)}
    words -= remove3

    # Never add blocked words, and never add junk 2-letter words.
    def accept(w: str) -> bool:
        if w in block or len(w) < 2:
            return False
        if len(w) == 2 and w not in allow2:
            return False
        return True

    added_long = sorted(w for w in enable_long if accept(w) and w not in words)
    words.update(w for w in enable_long if accept(w))
    added_explicit = sorted(w for w in additions if accept(w) and w not in words)
    words.update(w for w in additions if accept(w))
    # Guarantee the 2-letter allowlist (includes OK) is present
    added_allow2 = sorted(w for w in allow2 if accept(w) and w not in words)
    words.update(w for w in allow2 if accept(w))

    final = sorted(words)
    WORDS_JSON.write_text(json.dumps(final, separators=(",", ":")), encoding="utf-8")

    # Audit artifact: every word this run removed from the previous file
    actually_removed = sorted(previous - words)
    actually_added = sorted(words - previous)
    manifest = {
        "previous_count": len(previous),
        "new_count": len(final),
        "bytes": WORDS_JSON.stat().st_size,
        "removed_total": len(actually_removed),
        "removed_blocklist": removed_block,
        "removed_2letter_junk": removed_2,
        "removed_rare_3letter": removed_3,
        "added_total": len(actually_added),
        "added_enable_9plus": len(added_long),
        "added_explicit": added_explicit,
        "added_allow2": added_allow2,
        "length_histogram": dict(sorted(Counter(len(w) for w in final).items())),
        "max_length": max(map(len, final)) if final else 0,
    }
    manifest_path = SRC / "last-build.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {WORDS_JSON.relative_to(ROOT)}")
    print(f"  {len(previous):,} -> {len(final):,} words ({WORDS_JSON.stat().st_size:,} bytes)")
    print(f"  removed {len(actually_removed):,} (blocklist {len(removed_block)}, 2-letter junk {len(removed_2)}, rare 3-letter {len(removed_3)})")
    print(f"  added {len(actually_added):,} (ENABLE 9+ {len(added_long)}, explicit {len(added_explicit)}, allowlist {len(added_allow2)})")
    print(f"  max length {manifest['max_length']}")
    print(f"  manifest {manifest_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
