import type { Line } from '@/skills/types'

/**
 * A number line from 0 to `max` with hops from `from` by `by` (forward for adding and "one more", back for taking
 * away and "one less"). The start is ringed, the end filled. Used on teach cards and with every reason.
 */
export function NumberLine({ line, label }: { line: Line; label?: string }) {
  const { max, from, by } = line
  const to = from + by
  const w = 640
  const pad = 30
  const x = (n: number) => pad + ((w - 2 * pad) * n) / max
  const y = 110
  const step = by > 0 ? 1 : -1
  const hops = Array.from({ length: Math.abs(by) }, (_, i) => from + i * step)
  return (
    <svg className="number-line" viewBox={`0 28 ${w} 122`} role="img" aria-label={label ?? `${from} → ${to}`}>
      <line x1={pad - 10} y1={y} x2={w - pad + 10} y2={y} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {Array.from({ length: max + 1 }, (_, n) => (
        <g key={n}>
          <line x1={x(n)} y1={y - 10} x2={x(n)} y2={y + 10} stroke="currentColor" strokeWidth="3" />
          <text x={x(n)} y={y + 36} textAnchor="middle" fontSize="24" fill="currentColor" fontWeight={n === from || n === to ? 700 : 400}>
            {n}
          </text>
        </g>
      ))}
      {hops.map((n, i) => {
        const a = x(n)
        const b = x(n + step)
        const mid = (a + b) / 2
        return <path key={i} d={`M${a} ${y - 6} Q${mid} ${y - 70} ${b} ${y - 6}`} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" markerEnd="url(#hop)" />
      })}
      <defs>
        <marker id="hop" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
        </marker>
      </defs>
      <circle cx={x(from)} cy={y} r="11" fill="var(--card)" stroke="var(--accent)" strokeWidth="5" />
      <circle cx={x(to)} cy={y} r="11" fill="var(--accent)" />
    </svg>
  )
}
