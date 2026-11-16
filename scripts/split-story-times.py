"""Splits the browser's story timing (scripts/story-times.js, saved as stories-timing.json) into
public/stories/times/<book>.json, keeping only times that fit their text: one per paragraph, in order.

    python3 scripts/split-story-times.py ~/Downloads/stories-timing.json
"""
import json, os, re, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
timing = json.load(open(sys.argv[1]))
src = open(os.path.join(root, 'src/media/storyList.ts')).read()
book_of = {}
for b in re.split(r"\n  \{\n    id: '", src)[1:]:
    book = b.split("'")[0]
    for m in re.finditer(r"\{ id: '([^']+)', title:", b):
        book_of[m.group(1)] = book
out, skipped = {}, []
for track, t in sorted(timing.items()):
    book = book_of.get(track)
    path = os.path.join(root, 'public/stories', f'{book}.json')
    paras = json.load(open(path)).get(track) if book and os.path.exists(path) else None
    starts = t['s']
    if not paras or len(starts) != len(paras) or any(b <= a for a, b in zip(starts, starts[1:])):
        skipped.append(track)
        continue
    out.setdefault(book, {})[track] = starts
os.makedirs(os.path.join(root, 'public/stories/times'), exist_ok=True)
for book, tracks in out.items():
    with open(os.path.join(root, 'public/stories/times', f'{book}.json'), 'w') as f:
        json.dump(tracks, f, separators=(',', ':'))
        f.write('\n')
print(sum(len(t) for t in out.values()), 'recordings timed in', len(out), 'books; skipped:', ', '.join(skipped) or 'none')
