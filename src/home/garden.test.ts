import { describe, expect, it } from 'vitest'
import { MAX_TREES, spot, WIDTH } from './Garden'

describe('the garden', () => {
  it('gives every tree drawn (and the empty plots after them) its own place', () => {
    const places = new Set(Array.from({ length: MAX_TREES + 3 }, (_, i) => `${spot(i).x},${spot(i).y}`))
    expect(places.size).toBe(MAX_TREES + 3)
  })
  it('plants the first trees in the middle, which every screen shows', () => {
    expect(Math.abs(spot(0).x - WIDTH / 2)).toBeLessThan(80)
  })
  it('fits the picture', () => {
    for (let i = 0; i < MAX_TREES + 3; i++) {
      const { x, y } = spot(i)
      expect(x).toBeGreaterThan(20)
      expect(x).toBeLessThan(WIDTH - 20)
      expect(y).toBeLessThan(330)
    }
  })
})
