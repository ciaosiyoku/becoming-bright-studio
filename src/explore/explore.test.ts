import { describe, expect, it } from 'vitest'
import { LANGS } from '@/i18n'
import CREDITS from './photo-credits.json'
import { FACTS, factOrder } from './facts'
import { PLACES, placeCountry } from './places'
import { seeded } from '@/skills/random'
import { WHY_TOPICS, WHYS } from './whys'

const emojis = new Set(Object.keys(import.meta.glob('/public/emoji/*.png')).map((f) => f.replace('/public/emoji/', '').replace('.png', '')))
const photos = new Set(Object.keys(import.meta.glob('/public/photos/places/*.jpg')).map((f) => f.replace('/public/photos/places/', '').replace('.jpg', '')))

describe('500 Whys', () => {
  it('has 500 whys, 50 per topic, each with a different id and a picture that exists', () => {
    expect(WHYS.length).toBe(500)
    for (const t of WHY_TOPICS) expect(WHYS.filter((w) => w.topic === t).length, t).toBe(50)
    expect(new Set(WHYS.map((w) => w.id)).size).toBe(500)
    expect(WHYS.filter((w) => !emojis.has(w.emoji)).map((w) => w.id)).toEqual([])
  })
  it('asks a question and answers it in every language', () => {
    for (const w of WHYS)
      for (const { id } of LANGS) {
        const [q, a] = w[id]
        expect(q.trim().endsWith('?'), `${w.id} · ${id}: ${q}`).toBe(true)
        expect(a.length, `${w.id} · ${id}`).toBeGreaterThan(15)
      }
  })
  it('asks each question only once', () => {
    for (const { id } of LANGS) expect(new Set(WHYS.map((w) => w[id][0])).size, id).toBe(500)
  })
})

describe('Did you know?', () => {
  it('has every fact in every language, with a picture that exists', () => {
    for (const f of FACTS) {
      expect(emojis.has(f.emoji), f.emoji).toBe(true)
      for (const s of [f.text, f.de, f.fr, f.yo]) expect(s.length).toBeGreaterThan(10)
    }
  })
  it('shows every fact once in a new order', () => {
    const order = factOrder(seeded(4))
    expect(order.length).toBe(FACTS.length)
    expect(new Set(order).size).toBe(FACTS.length)
  })
})

describe('Places of the world', () => {
  it('has a photo with a credit and a country for every place', () => {
    const credits = CREDITS as Record<string, unknown>
    for (const p of PLACES) {
      expect(photos.has(p.id), `photo ${p.id}`).toBe(true)
      expect(credits[p.id], `credit ${p.id}`).toBeDefined()
      for (const { id } of LANGS) {
        expect(p.text[id].name.length > 1 && p.text[id].about.length > 20, `${p.id} · ${id}`).toBe(true)
        expect(placeCountry(p, id).length, `${p.id} · ${id}`).toBeGreaterThan(1)
      }
    }
  })
})
