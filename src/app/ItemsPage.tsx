import { Lock } from 'lucide-react'
import { useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { accessOf, earnedSecondsLeft, isOpen, itemState } from './access'
import { type ItemId, ITEMS, itemsOf, type Tab } from './items'
import { useToday } from '@/shared/useToday'
import { activeChild } from './state'
import { useStore } from './store'

/** The Games, Listen and watch, or Explore tab: one tile per item the grown-ups left on; "earn first" ones lock without earned time. */
export function ItemsPage({ tab, onOpen }: { tab: Tab; onOpen: (id: ItemId) => void }) {
  const T = useT()
  const today = useToday()
  const { state } = useStore()
  const child = activeChild(state)!
  const left = earnedSecondsLeft(child, state.family, today)
  const items = itemsOf(tab).map((id) => ({ id, state: itemState(accessOf(state.family, id, ITEMS[id].access), left) })).filter((x) => x.state !== 'hidden')
  return (
    <main className="page">
      {items.some((x) => x.state === 'locked') && <p className="muted">{T.access.timeUp}</p>}
      <div className="tiles">
        {items.map(({ id, state: s }) => (
          <button key={id} className={`tile ${isOpen(s) ? '' : 'locked'}`} disabled={!isOpen(s)} onClick={() => onOpen(id)}>
            <Emoji name={ITEMS[id].emoji} size={64} />
            <span>{T.items[id]}</span>
            <small>{s === 'locked' ? <><Lock size={14} /> {T.access.locked}</> : T.itemLearn[id]}</small>
          </button>
        ))}
      </div>
    </main>
  )
}
