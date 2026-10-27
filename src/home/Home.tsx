import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { activeChild, updateChild } from '@/app/state'
import { useStore } from '@/app/store'
import { backupDue } from '@/data/backup'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { bySubject, skillById, skillText, SUBJECT_EMOJI, SUBJECTS } from '@/skills/index'
import type { Subject } from '@/skills/types'
import './Home.css'

/**
 * The Learn tab: only the skill the child chose (and a button to choose another), so one thing is in front of them.
 * Choosing is two steps: a subject, then one of its skills in teaching order (learnt ones show as trees).
 * Once a week, a backup reminder for the grown-ups.
 */
export function Home({ onLesson, onParent }: { onLesson: (skill: string) => void; onParent: () => void }) {
  const T = useT()
  const lang = useLang()
  const { state, update } = useStore()
  const child = activeChild(state)!
  const [now] = useState(Date.now)
  const current = child.current ? skillById(child.current) : undefined
  const [choosing, setChoosing] = useState<Subject | 'subjects' | null>(current ? null : 'subjects')
  const choose = (id: string) => {
    update((s) => updateChild(s, child.id, (c) => ({ ...c, current: id })))
    setChoosing(null)
  }

  return (
    <main className="page">
      {backupDue(state, now) && (
        <button className="backup-reminder secondary" onClick={onParent}>
          <Emoji name="memo" size={32} /> {T.home.backupDue}
        </button>
      )}
      {choosing === null && current && (
        <section className="card todays">
          <h2>{T.home.yourSkill}</h2>
          <Emoji name={child.skills[current.id]?.mastered ? 'tree' : current.emoji} size={120} />
          <p className="todays-title">{skillText(current, lang).title}</p>
          <p className="muted">
            {T.home.subjects[current.subject]} · {child.skills[current.id]?.mastered ? T.home.learnt : T.home.level(current.stage + 1)}
          </p>
          <div className="row center">
            <button className="big" onClick={() => onLesson(current.id)}>
              {T.home.start}
            </button>
            <button className="secondary" onClick={() => setChoosing('subjects')}>
              {T.home.change}
            </button>
          </div>
        </section>
      )}
      {choosing === 'subjects' && (
        <section className="card">
          <div className="chooser-top">
            {current && (
              <button className="secondary round" onClick={() => setChoosing(null)} aria-label={T.common.back}>
                <ArrowLeft />
              </button>
            )}
            <h2>{T.home.chooseSubject}</h2>
          </div>
          <div className="tiles">
            {SUBJECTS.map((subject) => {
              const skills = bySubject(subject)
              const learnt = skills.filter((s) => child.skills[s.id]?.mastered).length
              return (
                <button key={subject} className="tile" onClick={() => setChoosing(subject)}>
                  <Emoji name={SUBJECT_EMOJI[subject]} size={56} />
                  <span>{T.home.subjects[subject]}</span>
                  <small>{T.home.learntOf(learnt, skills.length)}</small>
                </button>
              )
            })}
          </div>
        </section>
      )}
      {choosing !== null && choosing !== 'subjects' && (
        <section className="card">
          <div className="chooser-top">
            <button className="secondary round" onClick={() => setChoosing('subjects')} aria-label={T.common.back}>
              <ArrowLeft />
            </button>
            <h2>{T.home.subjects[choosing]}</h2>
          </div>
          <p className="muted">{T.home.pickSkill}</p>
          <div className="path">
            {bySubject(choosing).map((def) => {
              const learnt = Boolean(child.skills[def.id]?.mastered)
              return (
                <button key={def.id} className={`path-skill ${learnt ? 'learnt' : ''} ${def.id === child.current ? 'open' : ''}`} onClick={() => choose(def.id)}>
                  <Emoji name={learnt ? 'tree' : def.emoji} size={48} />
                  <span>{skillText(def, lang).title}</span>
                  <small>{learnt ? T.home.learnt : T.home.level(def.stage + 1)}</small>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
