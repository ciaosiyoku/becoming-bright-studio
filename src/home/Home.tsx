import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { subjectState } from '@/app/access'
import { activeChild, updateChild } from '@/app/state'
import { streaks } from '@/app/streak'
import { useToday } from '@/shared/useToday'
import { useStore } from '@/app/store'
import { backupDue } from '@/data/backup'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { suitsAge } from '@/skills/ages'
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
  /** The skills of a subject for this child's age (all of them before an age is set). */
  const forChild = (subject: Subject) => bySubject(subject).filter((def) => suitsAge(def, child.age))
  const [now] = useState(Date.now)
  const today = useToday()
  const streak = streaks(child, today)
  const stateOf = (subject: Subject) => subjectState(state.family, child, subject, today)
  const current = child.current ? skillById(child.current) : undefined
  const [choosing, setChoosing] = useState<Subject | 'subjects' | null>(current ? null : 'subjects')
  const choose = (id: string) => {
    update((s) => updateChild(s, child.id, (c) => ({ ...c, current: id })))
    setChoosing(null)
  }

  return (
    <main className="page">
      <section className={`card streak ${streak.today ? 'done' : ''}`} aria-live="polite">
        <Emoji name={streak.current > 0 ? 'fire' : 'seedling'} size={44} />
        <span className="streak-text">
          <b>{streak.current > 0 ? T.home.streak(streak.current) : T.home.streakStart}</b>
          {streak.current > 0 && !streak.today && <small>{T.home.streakKeep}</small>}
        </span>
        {streak.best > 0 && <span className="pill">{T.home.bestStreak(streak.best)}</span>}
      </section>
      {backupDue(state, now) && (
        <button className="backup-reminder secondary" onClick={onParent}>
          <Emoji name="memo" size={32} /> {T.home.backupDue}
        </button>
      )}
      {choosing === null && current && stateOf(current.subject) !== 'open' && (
        <section className="card todays">
          <Emoji name="locked" size={100} />
          <p>{T.access.subjectLocked(state.family.rewards.lessonsToOpen)}</p>
          <button className="big" onClick={() => setChoosing('subjects')}>
            {T.home.change}
          </button>
        </section>
      )}
      {choosing === null && current && stateOf(current.subject) === 'open' && (
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
          <p className="muted">{child.age ? T.home.forAge(child.age) : T.home.allAges}</p>
          <div className="tiles">
            {SUBJECTS.filter((subject) => forChild(subject).length > 0 && stateOf(subject) !== 'hidden').map((subject) => {
              const skills = forChild(subject)
              const learnt = skills.filter((s) => child.skills[s.id]?.mastered).length
              const locked = stateOf(subject) === 'locked'
              return (
                <button key={subject} className={`tile ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => setChoosing(subject)}>
                  <Emoji name={locked ? 'locked' : SUBJECT_EMOJI[subject]} size={56} />
                  <span>{T.home.subjects[subject]}</span>
                  <small>{locked ? T.access.subjectLocked(state.family.rewards.lessonsToOpen) : T.home.learntOf(learnt, skills.length)}</small>
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
            {forChild(choosing).map((def) => {
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
