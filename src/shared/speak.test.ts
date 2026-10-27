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
  it('picks a voice of the chosen kind, else an unknown one, else the other kind', () => {
    const voices = [v('Microsoft Libby'), v('Microsoft Ryan'), v('English United Kingdom')]
    expect(pickVoice(voices, 'en', 'male')).toEqual({ voice: voices[1], exact: true })
    expect(pickVoice(voices, 'en', 'female')).toEqual({ voice: voices[0], exact: true })
    expect(pickVoice([v('Samantha')], 'en', 'male')).toEqual({ voice: v('Samantha'), exact: false })
    expect(pickVoice([v('English United Kingdom'), v('Samantha')], 'en', 'male')?.voice.name).toBe('English United Kingdom')
    expect(pickVoice([], 'en', 'male')).toBeNull()
  })
})
