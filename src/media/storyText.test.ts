import { describe, expect, it } from 'vitest'
import { paragraphAt, paragraphStarts, startsOf } from './storyText'
import { STORIES } from './storyList'

const files = import.meta.glob<Record<string, string[]>>('/public/stories/*.json', { eager: true, import: 'default' })
const times = import.meta.glob<Record<string, number[]>>('/public/stories/times/*.json', { eager: true, import: 'default' })

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

describe('measured times', () => {
  it('are used when there is one for every paragraph, else the guess', () => {
    const paras = ['one two', 'three four', 'five six']
    expect(startsOf(paras, 100, [20, 30, 40])).toEqual([20, 30, 40])
    expect(startsOf(paras, 100, [20, 30])).toEqual(paragraphStarts(paras, 100))
    expect(startsOf(paras, 100, undefined)).toEqual(paragraphStarts(paras, 100))
  })
})

describe('story times', () => {
  it('give one start per paragraph, in order, inside the recording', () => {
    const tracks = new Map(STORIES.flatMap((b) => b.tracks.map((t) => [t.id, t] as const)))
    let n = 0
    for (const [path, book] of Object.entries(times)) {
      const text = files[path.replace('/times/', '/')]
      for (const [id, starts] of Object.entries(book)) {
        expect(starts.length, id).toBe(text[id].length)
        expect(starts.every((t, i) => t >= 0 && (i === 0 || t > starts[i - 1])), id).toBe(true)
        expect(starts[starts.length - 1], id).toBeLessThan(tracks.get(id)!.length + 30)
        n++
      }
    }
    expect(n).toBeGreaterThan(150)
  })
})
