import { Emoji } from '@/shared/Emoji'
import type { Visual } from '@/skills/types'

/** What a question or teach card shows: pictures to count, a sum, or one picture (with its word or without). */
export function VisualView({ visual, big = false }: { visual: Visual; big?: boolean }) {
  if (visual.kind === 'sum') return <span className={big ? 'sum big' : 'sum'}>{visual.text}</span>
  if (visual.kind === 'count')
    return (
      <span className="count">
        {Array.from({ length: visual.n }, (_, i) => (
          <Emoji key={i} name={visual.emoji} size={big ? 72 : 48} />
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
