import { describe, expect, it } from 'vitest'
import { AGE_BANDS } from '@/skills/ages'
import { FABLES, fableKey } from './index'

const all = AGE_BANDS.flatMap((b) => FABLES[b])
const emojis = new Set(Object.keys(import.meta.glob('/public/emoji/*.png')).map((f) => f.replace('/public/emoji/', '').replace('.png', '')))

describe('fables', () => {
  it('has 50 fables for every age range', () => {
    for (const b of AGE_BANDS) expect(FABLES[b], b).toHaveLength(50)
  })
  it('never repeats a fable, an id or a title', () => {
    expect(new Set(all.map(fableKey)).size).toBe(all.length)
    expect(new Set(all.map((f) => f.title)).size).toBe(all.length)
  })
  it('gives every fable a picture, a story and a lesson', () => {
    for (const f of all) {
      expect(emojis.has(f.emoji), `${f.id}: ${f.emoji}`).toBe(true)
      expect(f.text.length, f.id).toBeGreaterThanOrEqual(2)
      expect(f.text.every((p) => p.trim().length > 20), f.id).toBe(true)
      expect(f.moral.trim().length, f.id).toBeGreaterThan(10)
    }
  })
  it('gets longer as the children get older', () => {
    const words = (b: (typeof AGE_BANDS)[number]) => FABLES[b].reduce((n, f) => n + f.text.join(' ').split(/\s+/).length, 0) / FABLES[b].length
    for (let i = 1; i < AGE_BANDS.length; i++) expect(words(AGE_BANDS[i]), AGE_BANDS[i]).toBeGreaterThan(words(AGE_BANDS[i - 1]))
  })
})
