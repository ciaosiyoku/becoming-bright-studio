import { describe, expect, it } from 'vitest'
import { notesOf, type Sound } from './sounds'

describe('sounds', () => {
  it('are short and soft: every sound ends within a second', () => {
    for (const s of ['tap', 'right', 'miss', 'done'] as Sound[]) {
      const notes = notesOf(s)
      expect(notes.length, s).toBeGreaterThan(0)
      expect(Math.max(...notes.map((n) => n.at + n.length)), s).toBeLessThanOrEqual(1)
    }
  })
  it('a right answer rises; a miss is low and goes gently down (never a buzzer)', () => {
    const right = notesOf('right')
    expect(right[1].hz).toBeGreaterThan(right[0].hz)
    const [miss] = notesOf('miss')
    expect(miss.wave).toBe('sine')
    expect(miss.hz).toBeLessThan(400)
    expect(miss.toHz).toBeLessThan(miss.hz)
  })
})
