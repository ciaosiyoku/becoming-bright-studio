import { Emoji } from '@/shared/Emoji'
import type { Visual } from '@/skills/types'

/** What a question or teach card shows: pictures to count, a sum, one picture (with its word or without), or two. */
export function VisualView({ visual, big = false }: { visual: Visual; big?: boolean }) {
  // A sentence (homophones) is shown smaller than a sum, so it fits.
  if (visual.kind === 'sum') return <span className={`sum ${big ? 'big' : ''} ${visual.text.length > 16 ? 'long' : ''}`}>{visual.text}</span>
  if (visual.kind === 'count')
    return (
      <span className="count">
        {Array.from({ length: visual.n }, (_, i) => (
          <Emoji key={i} name={visual.emoji} size={big ? 72 : 48} />
        ))}
      </span>
    )
  if (visual.kind === 'pattern')
    return (
      <span className="pattern">
        {visual.items.map((name, i) => (
          <Emoji key={i} name={name} size={big ? 64 : 34} />
        ))}
        {visual.filled ? <Emoji name={visual.filled} size={big ? 64 : 34} className="filled" /> : <b className="gap">?</b>}
      </span>
    )
  if (visual.kind === 'blocks')
    return (
      <span className="blocks" aria-label={`${visual.tens} × 10 + ${visual.ones}`}>
        {Array.from({ length: visual.tens }, (_, i) => (
          <i key={`t${i}`} className="ten" />
        ))}
        <span className="ones">
          {Array.from({ length: visual.ones }, (_, i) => (
            <i key={`o${i}`} />
          ))}
        </span>
      </span>
    )
  if (visual.kind === 'pair')
    return (
      <span className="pair">
        {[visual.a, visual.b].map((p) => (
          <span key={p.word} className="picture">
            <Emoji name={p.emoji} size={big ? 130 : 80} />
            <b>{p.word}</b>
          </span>
        ))}
      </span>
    )
  return (
    <span className="picture">
      <Emoji name={visual.emoji} size={big ? 150 : 90} />
      {visual.word && <b>{visual.word}</b>}
    </span>
  )
}
