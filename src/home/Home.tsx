import { Settings } from 'lucide-react'
import { useState } from 'react'
import { activeChild } from '@/app/state'
import { useStore } from '@/app/store'
import { backupDue } from '@/data/backup'
import { useLang, useT } from '@/i18n'
import { isOpen, nextSkill } from '@/lesson/session'
import { Emoji } from '@/shared/Emoji'
import { skillById, SKILLS, skillText } from '@/skills/index'
import './Home.css'

const ORDER = SKILLS.map((s) => s.id)

/**
 * The child's home: who is learning (when there are two or more children), hello, today's lesson, the path of
 * skills, and (once a week) a backup reminder for the grown-ups. Switching child needs no PIN and no second install.
 */
export function Home({ onLesson, onParent }: { onLesson: (skill: string) => void; onParent: () => void }) {
  const T = useT()
  const lang = useLang()
  const { state, update } = useStore()
  const child = activeChild(state)!
  const [now] = useState(Date.now)
  const today = nextSkill(child, ORDER)
  const todayDef = today ? skillById(today) : undefined
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
      <section className="card todays">
        {todayDef ? (
          <>
            <h2>{T.home.todays}</h2>
            <Emoji name={todayDef.emoji} size={110} />
            <p className="todays-title">{skillText(todayDef, lang).title}</p>
            <button className="big" onClick={() => onLesson(todayDef.id)}>
              {T.home.start}
            </button>
          </>
        ) : (
          <>
            <Emoji name="tree" size={110} />
            <h2>{T.home.allDone}</h2>
          </>
        )}
      </section>
      <section className="card">
        <h2>{T.home.path}</h2>
        <div className="path">
          {SKILLS.map((def) => {
            const learnt = Boolean(child.skills[def.id]?.mastered)
            const open = isOpen(child, ORDER, def.id)
            return (
              <button key={def.id} className={`path-skill ${learnt ? 'learnt' : open ? 'open' : 'later'}`} disabled={!open} onClick={() => onLesson(def.id)}>
                <Emoji name={learnt ? 'tree' : def.emoji} size={48} />
                <span>{skillText(def, lang).title}</span>
                <small>{learnt ? T.home.learnt : open ? T.home.next : T.home.later}</small>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}
