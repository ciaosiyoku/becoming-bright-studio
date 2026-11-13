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

/** Where tree number i stands: back row first, each row a little bigger and lower (nearer). Pure (tested). */
export function spot(i: number): { x: number; y: number; scale: number } {
  const row = Math.floor(i / PER_ROW) % ROWS
  const col = i % PER_ROW
  return { x: 46 + col * 72 + (row % 2) * 34, y: 178 + row * 46, scale: 0.78 + row * 0.14 }
}

const CANOPY = ['#2fa36b', '#3cb878', '#36ae72']

export function Garden({ trees, label }: { trees: Subject[]; label: string }) {
  const shown = trees.slice(-MAX_TREES)
  const plots = [0, 1, 2].map((k) => shown.length + k)
  return (
    <svg className="garden" viewBox="0 0 680 330" preserveAspectRatio="xMidYMax slice" role="img" aria-label={label}>
      <rect width="680" height="330" fill="#ddf0fc" />
      <circle cx="610" cy="58" r="30" fill="#ffe08a" />
      <ellipse cx="130" cy="62" rx="44" ry="15" fill="#ffffff" />
      <ellipse cx="168" cy="54" rx="32" ry="17" fill="#ffffff" />
      <ellipse cx="420" cy="84" rx="38" ry="12" fill="#ffffff" />
      <path d="M0 170 Q170 120 340 160 T680 150 V330 H0 Z" fill="#bfe8cf" />
      <path d="M0 230 Q200 190 400 222 T680 214 V330 H0 Z" fill="#8fd6ae" />
      <path d="M0 290 Q220 266 680 282 V330 H0 Z" fill="#6cc596" />
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
