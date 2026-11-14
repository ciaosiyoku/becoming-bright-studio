import { describe, expect, it } from 'vitest'
import { genderOf, pickVoice, voicePlan } from './speak'

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
  it('gives Mary the most lifelike female voice and Barry a male one', () => {
    const voices = [v('Microsoft Hazel - English (United Kingdom)'), v('Microsoft Libby Online (Natural) - English (United Kingdom)', 'en-GB', false), v('Microsoft Ryan')]
    expect(pickVoice(voices, 'en', 'female')?.voice.name).toMatch(/Libby/)
    expect(pickVoice(voices, 'en', 'male')).toMatchObject({ voice: voices[2], exact: true, shared: false, pitch: 1 })
  })
  it('gives Mary and Barry different voices when the names do not say female or male (a tablet: one voice per accent)', () => {
    const plan = voicePlan([v('English United Kingdom'), v('English United States', 'en-US')], 'en')!
    expect(plan.female.voice).not.toBe(plan.male.voice)
    expect(plan.male.pitch).toBeLessThan(1)
    expect(plan.female.pitch).toBeGreaterThan(1)
  })
  it('never lets Mary and Barry sound alike, even with one voice or two female voices', () => {
    for (const voices of [[v('English United Kingdom')], [v('Samantha')], [v('Samantha'), v('Karen')], [v('Samantha'), v('Daniel')]]) {
      const plan = voicePlan(voices, 'en')!
      expect(plan.female.voice !== plan.male.voice || plan.female.pitch !== plan.male.pitch, voices.map((x) => x.name).join()).toBe(true)
    }
  })
  it('reads nothing when off, or without a voice', () => {
    expect(pickVoice([v('Microsoft Libby')], 'en', 'off')).toBeNull()
    expect(pickVoice([], 'en', 'female')).toBeNull()
  })
})
