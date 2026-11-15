import { describe, expect, it } from 'vitest'
import { paragraphAt, paragraphStarts } from './storyText'
import { STORIES } from './storyList'

const files = import.meta.glob<Record<string, string[]>>('/public/stories/*.json', { eager: true, import: 'default' })

describe('story texts', () => {
  it('belong to real recordings of the right book, with words in every part', () => {
    const tracks = new Map(STORIES.flatMap((b) => b.tracks.map((t) => [t.id, b.id] as const)))
    let n = 0
    for (const [path, text] of Object.entries(files)) {
      const book = path.replace('/public/stories/', '').replace('.json', '')
      for (const [id, paras] of Object.entries(text)) {
        expect(tracks.get(id), id).toBe(book)
        expect(paras.length, id).toBeGreaterThanOrEqual(3)
        expect(paras.every((p) => p.trim().length > 0 && p.split(/\s+/).length <= 240), id).toBe(true)
        n++
      }
    }
    expect(n).toBeGreaterThan(150)
  })
  it('shares the recording out over the paragraphs by their words, after the spoken introduction', () => {
    const starts = paragraphStarts(['one two', 'three four', 'five six seven eight nine ten'], 400)
    // 16 s introduction, 6 s at the end; words + a 2-word pause each: 4, 4, 8 of 16.
    expect(starts[0]).toBe(16)
    expect(starts[1]).toBeCloseTo(16 + 378 / 4)
    expect(starts[2]).toBeCloseTo(16 + 378 / 2)
    expect(paragraphAt(starts, 0)).toBe(0)
    expect(paragraphAt(starts, 120)).toBe(1)
    expect(paragraphAt(starts, 399)).toBe(2)
  })
})
