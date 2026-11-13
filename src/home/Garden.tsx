import type { Subject } from '@/skills/types'

// The child's garden: one tree for every skill learnt, the fruit in the subject's colour, and a few empty plots
// waiting for the next ones. Drawn here (no outside art). Decoration with a label: the counts are also in words.

/** Each subject's colours: the fruit here, and the subject cards on the Learn tab. */
export const SUBJECT_COLOURS: Record<Subject, { main: string; soft: string; deep: string }> = {
  numbers: { main: '#5aa9e6', soft: '#e4f2fd', deep: '#235e91' },
  words: { main: '#ff8a5b', soft: '#ffeadb', deep: '#9a4413' },
  patterns: { main: '#8b5cf6', soft: '#efe8fe', deep: '#5b33c2' },
  science: { main: '#22a06b', soft: '#dcf5ea', deep: '#145f40' },
  french: { main: '#e2557e', soft: '#fde4ef', deep: '#9b2458' },
}

const PER_ROW = 9
const ROWS = 3
/** The most trees drawn (the newest ones); the count in words is always the real one. */
export const MAX_TREES = PER_ROW * ROWS - 3

/** The picture is wide (a tablet in landscape); a narrower screen shows its middle. */
export const WIDTH = 1200
const HEIGHT = 330
/** Trees fill each row from the middle outwards, so the first ones are seen on every screen. */
const COLUMN_ORDER = [4, 3, 5, 2, 6, 1, 7, 0, 8]

/** Where tree number i stands: back row first, each row a little bigger and lower (nearer). Pure (tested). */
export function spot(i: number): { x: number; y: number; scale: number } {
  const row = Math.floor(i / PER_ROW) % ROWS
  const col = COLUMN_ORDER[i % PER_ROW]
  return { x: 170 + col * 108 + (row % 2) * 40, y: 196 + row * 50, scale: 0.86 + row * 0.14 }
}

const CANOPY = ['#2fa36b', '#3cb878', '#36ae72']

export function Garden({ trees, label }: { trees: Subject[]; label: string }) {
  const shown = trees.slice(-MAX_TREES)
  const plots = [0, 1, 2].map((k) => shown.length + k)
  return (
    <svg className="garden" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMax slice" role="img" aria-label={label}>
      <rect width={WIDTH} height={HEIGHT} fill="#ddf0fc" />
      <circle cx="860" cy="58" r="30" fill="#ffe08a" />
      <ellipse cx="380" cy="62" rx="44" ry="15" fill="#ffffff" />
      <ellipse cx="418" cy="54" rx="32" ry="17" fill="#ffffff" />
      <ellipse cx="700" cy="84" rx="38" ry="12" fill="#ffffff" />
      <path d="M0 176 Q300 120 600 166 T1200 156 V330 H0 Z" fill="#bfe8cf" />
      <path d="M0 236 Q340 196 700 228 T1200 220 V330 H0 Z" fill="#8fd6ae" />
      <path d="M0 296 Q400 270 1200 288 V330 H0 Z" fill="#6cc596" />
      {plots.map((i) => {
        const { x, y, scale } = spot(i)
        return <ellipse key={`plot-${i}`} cx={x} cy={y + 4} rx={26 * scale} ry={9 * scale} fill="none" stroke="#2e7d57" strokeWidth="3" strokeDasharray="6 6" />
      })}
      {shown.map((subject, i) => {
        const { x, y, scale } = spot(i)
        const fruit = SUBJECT_COLOURS[subject].main
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
            <rect x="-5" y="-30" width="10" height="34" rx="4" fill="#9a6b47" />
            <circle cx="0" cy="-46" r="28" fill={CANOPY[i % CANOPY.length]} />
            <circle cx="-10" cy="-52" r="5" fill={fruit} />
            <circle cx="10" cy="-42" r="5" fill={fruit} />
            <circle cx="2" cy="-62" r="5" fill={fruit} />
          </g>
        )
      })}
    </svg>
  )
}
