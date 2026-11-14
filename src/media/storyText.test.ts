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
  it('shares the recording out over the paragraphs by their length, after the spoken introduction', () => {
    const starts = paragraphStarts(['a'.repeat(100), 'b'.repeat(100), 'c'.repeat(200)], 400)
    expect(starts[0]).toBe(24)
    expect(starts[1]).toBeCloseTo(24 + 368 / 4)
    expect(starts[2]).toBeCloseTo(24 + 368 / 2)
    expect(paragraphAt(starts, 0)).toBe(0)
    expect(paragraphAt(starts, 120)).toBe(1)
    expect(paragraphAt(starts, 399)).toBe(2)
  })
})
