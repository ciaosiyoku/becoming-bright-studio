// The words of the story recordings, for the story film (Stories.tsx): each book's public-domain text from Project
// Gutenberg, cut into the parts each LibriVox recording reads, in public/stories/<book>.json ({ trackId: paragraphs }).
// A book's file is fetched the first time one of its stories plays (then kept for offline use by the service worker).
// Recordings without a text (no matching edition was found) keep the single scene made from their title.
//
// Where in the text the reader is: a LibriVox recording starts with a short spoken introduction and ends with a short
// closing line; in between, the paragraphs are read in order, so the time is shared out by their length. A guess, not
// a sync: a scene may change a few seconds early or late.

export type StoryText = Record<string, string[]>

const loaded = new Map<string, Promise<StoryText | null>>()

/** A book's text, or null when it has none or it cannot be fetched (offline before it was ever opened). */
export function loadStoryText(book: string): Promise<StoryText | null> {
  if (!loaded.has(book)) {
    const p = fetch(`${import.meta.env.BASE_URL}stories/${book}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<StoryText>) : null))
      .catch(() => null)
    p.then((t) => t ?? loaded.delete(book))
    loaded.set(book, p)
  }
  return loaded.get(book)!
}

/** The spoken introduction and closing line of a LibriVox recording, in seconds. */
const lead = (duration: number) => Math.min(24, duration * 0.06)
const TAIL = 8

/** When each paragraph starts, in seconds, for a recording of this length. Pure (tested). */
export function paragraphStarts(paragraphs: string[], duration: number): number[] {
  const total = paragraphs.reduce((n, p) => n + p.length, 0) || 1
  const from = lead(duration)
  const span = Math.max(1, duration - from - TAIL)
  let acc = 0
  return paragraphs.map((p) => {
    const at = from + (acc / total) * span
    acc += p.length
    return at
  })
}

/** The paragraph being read at a time. Pure (tested). */
export function paragraphAt(starts: number[], time: number): number {
  let i = 0
  while (i + 1 < starts.length && starts[i + 1] <= time) i++
  return i
}
