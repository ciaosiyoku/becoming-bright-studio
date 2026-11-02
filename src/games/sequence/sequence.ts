/** Pads and target length for a level: 4 pads up to level 2, then 5, then 6; the pattern grows to level + 2. */
export const sequenceLevel = (level: number) => ({ pads: level <= 2 ? 4 : level <= 5 ? 5 : 6, length: level + 2 })
