import { describe, expect, it } from 'vitest'
import { forSpeech } from './spoken'

describe('reading maths aloud', () => {
  it('says the signs between numbers as words', () => {
    expect(forSpeech('What is 4 − 2?', 'en')).toBe('What is 4 minus 2?')
    expect(forSpeech('What is 7 + 5?', 'en')).toBe('What is 7 plus 5?')
    expect(forSpeech('6 × 3 = 18', 'en')).toBe('6 times 3 equals 18')
    expect(forSpeech('12 ÷ 4 = ?', 'en')).toBe('12 divided by 4 equals what')
    expect(forSpeech('3 + _ = 5', 'en')).toBe('3 plus what equals 5')
    expect(forSpeech('8 - 3', 'en')).toBe('8 minus 3')
    expect(forSpeech('Was ist 4 − 2?', 'de')).toBe('Was ist 4 minus 2?')
    expect(forSpeech('6 × 3', 'de')).toBe('6 mal 3')
    expect(forSpeech('Combien font 4 − 2 ?', 'fr')).toBe('Combien font 4 moins 2?')
  })
  it('reads arrows, fractions, per cent, degrees and comparisons', () => {
    expect(forSpeech('Start at 9, jump back 4 → 5.', 'en')).toBe('Start at 9, jump back 4, that makes 5.')
    expect(forSpeech('What is 3/4 of 8?', 'en')).toBe('What is 3 quarters of 8?')
    expect(forSpeech('1/2', 'en')).toBe('one half')
    expect(forSpeech('3/4', 'de')).toBe('3 Viertel')
    expect(forSpeech('25%', 'fr')).toBe('25 pour cent')
    expect(forSpeech('It is 30°C.', 'en')).toBe('It is 30 degrees C.')
    expect(forSpeech('7 > 3', 'en')).toBe('7 is more than 3')
    expect(forSpeech('2 < 9', 'de')).toBe('2 ist kleiner als 9')
  })
  it('leaves ordinary words alone and drops pictures', () => {
    expect(forSpeech('A well-known story, for ages 10–12.', 'en')).toBe('A well-known story, for ages 10–12.')
    expect(forSpeech('How many 🍎 are there?', 'en')).toBe('How many are there?')
    expect(forSpeech('Qui est là ?', 'fr')).toBe('Qui est là?')
  })
})
