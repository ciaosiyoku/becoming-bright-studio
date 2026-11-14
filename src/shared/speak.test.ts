import { describe, expect, it } from 'vitest'
import { genderOf, pickVoice } from './speak'

const v = (name: string, lang = 'en-GB', localService = true) => ({ name, lang, localService })

describe('reading voice', () => {
  it('knows the usual voices by name', () => {
    expect(genderOf('Microsoft Libby Online (Natural) - English (United Kingdom)')).toBe('female')
    expect(genderOf('Google UK English Female')).toBe('female')
    expect(genderOf('Google UK English Male')).toBe('male')
    expect(genderOf('Daniel')).toBe('male')
    expect(genderOf('Microsoft Katja - German (Germany)')).toBe('female')
    expect(genderOf('English United Kingdom')).toBeNull()
  })
  it('ranks the most lifelike voices first', () => {
    const voices = [v('Microsoft Hazel - English (United Kingdom)'), v('Microsoft Libby Online (Natural) - English (United Kingdom)', 'en-GB', false), v('Microsoft Ryan')]
    expect(pickVoice(voices, 'en', 'female-1')?.voice.name).toMatch(/Libby/)
    expect(pickVoice(voices, 'en', 'female-2')?.voice.name).toMatch(/Hazel/)
  })
  it('gives two voices of each kind; with only one, voice 2 is the same voice a little lower or higher', () => {
    const voices = [v('Microsoft Libby'), v('Microsoft Ryan'), v('English United Kingdom')]
    expect(pickVoice(voices, 'en', 'male-1')).toEqual({ voice: voices[1], exact: true, same: false, pitch: 1 })
    const male2 = pickVoice(voices, 'en', 'male-2')!
    expect(male2.voice).toBe(voices[1])
    expect(male2.same).toBe(true)
    expect(male2.pitch).toBeLessThan(1)
    expect(pickVoice(voices, 'en', 'female-2')!.pitch).toBeGreaterThan(1)
  })
  it('without a voice of the kind, the nearest reads higher or lower; off reads nothing', () => {
    expect(pickVoice([v('Samantha')], 'en', 'male-1')).toMatchObject({ exact: false, pitch: 0.8 })
    expect(pickVoice([v('English United Kingdom'), v('Samantha')], 'en', 'male-1')?.voice.name).toBe('English United Kingdom')
    expect(pickVoice([v('Microsoft Libby')], 'en', 'off')).toBeNull()
    expect(pickVoice([], 'en', 'female-1')).toBeNull()
  })
})
