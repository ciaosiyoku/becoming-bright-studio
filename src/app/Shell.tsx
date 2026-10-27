import { Clock, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { earnedSecondsLeft } from './access'
import { clock } from '@/shared/clock'
import { useToday } from '@/shared/useToday'
import { activeChild } from './state'
import { useStore } from './store'
import './Shell.css'

export type MainTab = 'learn' | 'games' | 'media' | 'explore'
const TABS: { id: MainTab; emoji: string }[] = [
  { id: 'learn', emoji: 'gradcap' },
  { id: 'games', emoji: 'joystick' },
  { id: 'media', emoji: 'radio' },
  { id: 'explore', emoji: 'globe' },
]

/**
 * The frame around the four tabs: hello and who is learning, the earned time left today, the grown-ups' button,
 * and the tab bar (Learn, Games, Listen and watch, Explore). Switching child needs no PIN.
 */
export function Shell({ tab, onTab, onParent, children }: { tab: MainTab; onTab: (t: MainTab) => void; onParent: () => void; children: ReactNode }) {
  const T = useT()
  const today = useToday()
  const { state, update } = useStore()
  const child = activeChild(state)!
  const left = earnedSecondsLeft(child, state.family, today)
  return (
    <div className="shell">
      <header className="shell-top">
        <h1>{T.home.hello(child.name)}</h1>
        {state.children.length > 1 && (
          <nav className="children" aria-label={T.home.who}>
            {state.children.map((c) => (
              <button key={c.id} className={c.id === child.id ? 'child on' : 'child'} style={{ ['--child' as string]: c.colour }} aria-pressed={c.id === child.id} onClick={() => update((s) => ({ ...s, activeChild: c.id }))}>
                {c.name || '?'}
              </button>
            ))}
          </nav>
        )}
        <span className="earned-chip" title={T.access.earnedTime}>
          <Clock size={20} /> {clock(left)}
        </span>
        <button className="secondary" onClick={onParent}>
          <Settings /> <span className="wide-only">{T.home.parents}</span>
        </button>
      </header>
      <div className="shell-main">{children}</div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'tab on' : 'tab'} aria-pressed={t.id === tab} onClick={() => onTab(t.id)}>
            <Emoji name={t.emoji} size={34} />
            <span>{T.nav[t.id]}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
