import { describe, expect, it } from 'vitest'
import { genderOf, pickVoice, shortName, voicePlan } from './speak'

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
    expect(pickVoice(voices, 'en', 'male-1')).toMatchObject({ voice: voices[2], exact: true, shared: false, pitch: 1 })
  })
  it('gives four different voices when the names do not say female or male (a tablet: one voice per accent)', () => {
    const voices = [v('English United Kingdom'), v('English United States', 'en-US'), v('English Australia', 'en-AU'), v('English India', 'en-IN')]
    const plan = voicePlan(voices, 'en')!
    const names = Object.values(plan).map((p) => p.voice.name)
    expect(new Set(names).size).toBe(4)
    expect(plan['male-1'].pitch).toBeLessThan(1)
    expect(plan['female-1'].pitch).toBeGreaterThan(1)
  })
  it('with fewer voices, choices share one, and voice 1 and 2 of a kind never sound alike', () => {
    for (const voices of [[v('English United Kingdom')], [v('English United Kingdom'), v('English United States', 'en-US')], [v('Samantha'), v('Daniel')]]) {
      const plan = voicePlan(voices, 'en')!
      for (const [one, two] of [['female-1', 'female-2'], ['male-1', 'male-2']] as const) {
        const a = plan[one]
        const b = plan[two]
        expect(a.voice !== b.voice || a.pitch !== b.pitch, `${voices.length} voices: ${one} / ${two}`).toBe(true)
      }
    }
  })
  it('reads nothing when off, or without a voice', () => {
    expect(pickVoice([v('Microsoft Libby')], 'en', 'off')).toBeNull()
    expect(pickVoice([], 'en', 'female-1')).toBeNull()
  })
  it('shortens a voice name for the buttons', () => {
    expect(shortName('Microsoft Libby Online (Natural) - English (United Kingdom)')).toBe('Libby Online')
    expect(shortName('English United Kingdom')).toBe('English United Kingdom')
    expect(shortName('Google UK English Female')).toBe('UK English Female')
  })
})
