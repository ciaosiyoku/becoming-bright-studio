import { Settings } from 'lucide-react'
import { useState } from 'react'
import { activeChild } from '@/app/state'
import { useStore } from '@/app/store'
import { backupDue } from '@/data/backup'
import { useLang, useT } from '@/i18n'
import { secondsLeft } from '@/games/pairs'
import { Emoji } from '@/shared/Emoji'
import { bySubject, SKILLS, skillText, SUBJECTS } from '@/skills/index'
import './Home.css'

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * The child's home: who is learning (when there are two or more children), hello, every skill to choose from
 * (grouped by subject, easiest first, learnt ones shown as trees), memory games when allowed, and (once a week) a
 * backup reminder for the grown-ups. Switching child needs no PIN and no second install.
 */
export function Home({ onLesson, onGame, onParent }: { onLesson: (skill: string) => void; onGame: (skill: string) => void; onParent: () => void }) {
  const T = useT()
  const lang = useLang()
  const { state, update } = useStore()
  const child = activeChild(state)!
  const [now] = useState(Date.now)
  // Memory games: one per learnt skill with time left, only when the grown-ups allow games.
  const games = state.family.gamesAllowed ? SKILLS.filter((s) => child.skills[s.id]?.mastered && secondsLeft(child.games[s.id]) > 0) : []
  return (
    <main className="home">
      <header className="home-top">
        <h1>{T.home.hello(child.name)}</h1>
        <button className="secondary" onClick={onParent}>
          <Settings /> {T.home.parents}
        </button>
      </header>
      {state.children.length > 1 && (
        <nav className="children" aria-label={T.home.who}>
          {state.children.map((c) => (
            <button key={c.id} className={c.id === child.id ? 'child on' : 'child'} style={{ ['--child' as string]: c.colour }} aria-pressed={c.id === child.id} onClick={() => update((s) => ({ ...s, activeChild: c.id }))}>
              {c.name || '?'}
            </button>
          ))}
        </nav>
      )}
      {backupDue(state, now) && (
        <button className="backup-reminder secondary" onClick={onParent}>
          <Emoji name="memo" size={32} /> {T.home.backupDue}
        </button>
      )}
      {games.length > 0 && (
        <section className="card">
          <h2>{T.games.title}</h2>
          <div className="games-row">
            {games.map((def) => (
              <button key={def.id} className="secondary game-tile" onClick={() => onGame(def.id)}>
                <Emoji name={def.emoji} size={40} />
                <span>{skillText(def, lang).title}</span>
                <small>{T.games.left(clock(secondsLeft(child.games[def.id])))}</small>
              </button>
            ))}
          </div>
        </section>
      )}
      <h2 className="choose">{T.home.choose}</h2>
      {SUBJECTS.map((subject) => (
        <section key={subject} className="card">
          <h2>{T.home.subjects[subject]}</h2>
          <div className="path">
            {bySubject(subject).map((def) => {
              const learnt = Boolean(child.skills[def.id]?.mastered)
              return (
                <button key={def.id} className={`path-skill ${learnt ? 'learnt' : ''}`} onClick={() => onLesson(def.id)}>
                  <Emoji name={learnt ? 'tree' : def.emoji} size={48} />
                  <span>{skillText(def, lang).title}</span>
                  <small>{learnt ? T.home.learnt : T.home.level(def.stage + 1)}</small>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
