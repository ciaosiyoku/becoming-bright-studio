import { describe, expect, it } from 'vitest'
import { roadPath, stoneSpot } from './road'

describe('the skill path', () => {
  it('winds: left to right, then back', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((i) => stoneSpot(i, 4).col)).toEqual([0, 1, 2, 3, 3, 2, 1, 0])
    expect(stoneSpot(4, 4).row).toBe(1)
  })
  it('draws a road through every stone, turning at the end of each row', () => {
    const d = roadPath(6, 4)
    expect(d.startsWith('M 12.5 34')).toBe(true)
    expect(d.match(/ L /g)?.length).toBe(4)
    expect(d.match(/ C /g)?.length).toBe(1)
    expect(roadPath(0, 4)).toBe('')
  })
})
