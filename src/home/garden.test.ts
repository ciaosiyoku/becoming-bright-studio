import { describe, expect, it } from 'vitest'
import { MAX_TREES, spot } from './Garden'

describe('the garden', () => {
  it('gives every tree drawn (and the empty plots after them) its own place', () => {
    const places = new Set(Array.from({ length: MAX_TREES + 3 }, (_, i) => `${spot(i).x},${spot(i).y}`))
    expect(places.size).toBe(MAX_TREES + 3)
  })
  it('fits the picture', () => {
    for (let i = 0; i < MAX_TREES + 3; i++) {
      const { x, y } = spot(i)
      expect(x).toBeGreaterThan(20)
      expect(x).toBeLessThan(660)
      expect(y).toBeLessThan(330)
    }
  })
})
