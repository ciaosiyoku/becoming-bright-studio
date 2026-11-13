// The skill path's layout: stepping stones winding like a board game, and the road through them. Pure (tested).

/** Where stone i sits: its row, and its column winding back on every other row. Pure. */
export const stoneSpot = (i: number, perRow: number) => {
  const row = Math.floor(i / perRow)
  const col = row % 2 === 0 ? i % perRow : perRow - 1 - (i % perRow)
  return { row, col }
}

/** The road through the stones, in a box 100 wide and 100 tall per row (stretched to the page). Pure. */
export function roadPath(count: number, perRow: number): string {
  const at = (i: number) => {
    const { row, col } = stoneSpot(i, perRow)
    return { x: ((col + 0.5) * 100) / perRow, y: row * 100 + 34 }
  }
  if (count === 0) return ''
  let d = `M ${at(0).x} ${at(0).y}`
  for (let i = 1; i < count; i++) {
    const a = at(i - 1)
    const b = at(i)
    if (a.y === b.y) d += ` L ${b.x} ${b.y}`
    else {
      // A turn at the end of a row: out past the edge and back in, like a road.
      const out = a.x > 50 ? 100 : 0
      d += ` C ${out} ${a.y} ${out} ${b.y} ${b.x} ${b.y}`
    }
  }
  return d
}
