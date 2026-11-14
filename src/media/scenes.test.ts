import { describe, expect, it } from 'vitest'
import { AGE_BANDS } from '@/skills/ages'
import { FABLES } from './fables'
import { actionOf, backdropOf, castOf, scenesOf, storyScene, wordAt, wordsOf } from './scenes'
import { STORIES } from './storyList'

const emojis = new Set(Object.keys(import.meta.glob('/public/emoji/*.png')).map((f) => f.replace('/public/emoji/', '').replace('.png', '')))

describe('animated scenes', () => {
  it('puts the animals a text names on stage, in order', () => {
    expect(castOf('The lion caught a little mouse, and a fox watched.')).toEqual(['animal-lion', 'animal-mouse', 'animal-fox'])
    expect(castOf('Tortoise raced the hare.')).toEqual(['animal-turtle', 'animal-rabbit'])
    expect(castOf('It rained all day.')).toEqual([])
  })
  it('finds the place and the movement', () => {
    expect(backdropOf('He swam across the river.')).toBe('water')
    expect(backdropOf('Up into the sky they flew.')).toBe('sky')
    expect(backdropOf('Nothing about a place.', 'town')).toBe('town')
    expect(actionOf('The hare lay down for a nap.')).toBe('sleep')
    expect(actionOf('She jumped and jumped.')).toBe('hop')
    expect(actionOf('He fell asleep.')).toBe('sleep')
    expect(actionOf('They talked.')).toBe('idle')
  })
  it('makes a scene for every paragraph of every fable, always with someone on stage and real pictures', () => {
    for (const band of AGE_BANDS)
      for (const f of FABLES[band]) {
        const scenes = scenesOf(f.text, f.emoji)
        expect(scenes, f.id).toHaveLength(f.text.length)
        for (const s of scenes) {
          expect(s.cast.length, f.id).toBeGreaterThan(0)
          for (const e of s.cast) expect(emojis.has(e), `${f.id}: ${e}`).toBe(true)
        }
      }
  })
  it('gives every story recording a scene with real pictures', () => {
    for (const book of STORIES)
      for (const t of book.tracks) for (const e of storyScene(t.title, book.emoji).cast) expect(emojis.has(e), `${t.id}: ${e}`).toBe(true)
  })
  it('knows which word is being read', () => {
    const words = wordsOf('The fox ran away.')
    expect(words.map((w) => w.word)).toEqual(['The', 'fox', 'ran', 'away.'])
    expect(wordAt(words, 0)).toBe(0)
    expect(wordAt(words, 4)).toBe(1)
    expect(wordAt(words, 9)).toBe(2)
    expect(wordAt(words, -3)).toBe(-1)
  })
})
