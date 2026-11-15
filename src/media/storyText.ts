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

/** The spoken introduction and closing line of a LibriVox recording, in seconds (about 15 and 6). */
const lead = (duration: number) => Math.min(16, duration * 0.05)
const TAIL = 6
/** A reader pauses between paragraphs: about as long as saying two words. */
const PAUSE = 2

/** How long a paragraph takes to read, in words (plus the pause after it). */
const weight = (p: string) => p.split(/\s+/).filter(Boolean).length + PAUSE

/**
 * When each paragraph starts, in seconds, for a recording of this length: the reading time shared out by words
 * (readers keep a steady pace in words, not letters), after the spoken introduction. Pure (tested).
 */
export function paragraphStarts(paragraphs: string[], duration: number): number[] {
  const total = paragraphs.reduce((n, p) => n + weight(p), 0) || 1
  const from = lead(duration)
  const span = Math.max(1, duration - from - TAIL)
  let acc = 0
  return paragraphs.map((p) => {
    const at = from + (acc / total) * span
    acc += weight(p)
    return at
  })
}

/** A recording's own correction (seconds), set with "the words are behind / ahead"; kept on this device. */
export function loadShift(track: string): number {
  try {
    return Number(localStorage.getItem(`bbs-story-shift:${track}`)) || 0
  } catch {
    return 0
  }
}
export function saveShift(track: string, shift: number) {
  try {
    localStorage.setItem(`bbs-story-shift:${track}`, String(Math.round(shift * 10) / 10))
  } catch {
    // Not kept (private browsing): it still works until the story is closed.
  }
}

/** The paragraph being read at a time. Pure (tested). */
export function paragraphAt(starts: number[], time: number): number {
  let i = 0
  while (i + 1 < starts.length && starts[i + 1] <= time) i++
  return i
}
