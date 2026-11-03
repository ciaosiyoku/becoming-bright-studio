import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { subjectState } from '@/app/access'
import { activeChild, updateChild } from '@/app/state'
import { lastDays, streaks } from '@/app/streak'
import { useToday } from '@/shared/useToday'
import { useStore } from '@/app/store'
import { backupDue } from '@/data/backup'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { suitsAge } from '@/skills/ages'
import { bySubject, skillById, skillText, SUBJECT_EMOJI, SUBJECTS } from '@/skills/index'
import type { Subject } from '@/skills/types'
import './Home.css'

/** Where the Learn tab is: all subjects, one subject's skills, or one skill ready to start. */
type View = { name: 'subjects' } | { name: 'subject'; subject: Subject } | { name: 'skill'; id: string }

/**
 * The Learn tab. The main page shows the streak (with the last 7 days) and every subject for the child's age; a
 * subject opens its skills in teaching order (learnt ones show as trees), and a skill opens its card with Start.
 * Back goes one step up: skill → its subject → all subjects. Once a week, a backup reminder for the grown-ups.
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
  const week = lastDays(child, today)
  const weekday = new Intl.DateTimeFormat(lang, { weekday: 'narrow' })
  const stateOf = (subject: Subject) => subjectState(state.family, child, subject, today)
  const current = child.current ? skillById(child.current) : undefined
  const [view, setView] = useState<View>({ name: 'subjects' })
  const openSkill = (id: string) => {
    update((s) => updateChild(s, child.id, (c) => ({ ...c, current: id })))
    setView({ name: 'skill', id })
  }
  const shown = view.name === 'skill' ? skillById(view.id) : undefined

  return (
    <main className="page">
      <section className={`card streak ${streak.today ? 'done' : ''}`} aria-live="polite">
        <Emoji name={streak.current > 0 ? 'fire' : 'seedling'} size={44} />
        <span className="streak-text">
          <b>{streak.current > 0 ? T.home.streak(streak.current) : T.home.streakStart}</b>
          {streak.current > 0 && !streak.today && <small>{T.home.streakKeep}</small>}
        </span>
        <ol className="streak-week" aria-label={T.home.lastWeek}>
          {week.map(({ day, done }) => {
            const [y, m, d] = day.split('-').map(Number)
            return (
              <li key={day} className={`${done ? 'done' : ''} ${day === today ? 'today' : ''}`} title={day}>
                <span className="streak-dot">{done ? '✓' : ''}</span>
                <small>{weekday.format(new Date(y, m - 1, d))}</small>
              </li>
            )
          })}
        </ol>
        {streak.best > 0 && <span className="pill">{T.home.bestStreak(streak.best)}</span>}
      </section>
      {backupDue(state, now) && (
        <button className="backup-reminder secondary" onClick={onParent}>
          <Emoji name="memo" size={32} /> {T.home.backupDue}
        </button>
      )}

      {view.name === 'subjects' && (
        <section className="card">
          <h2>{T.home.chooseSubject}</h2>
          <p className="muted">{child.age ? T.home.forAge(child.age) : T.home.allAges}</p>
          {current && stateOf(current.subject) === 'open' && (
            <button className="secondary continue" onClick={() => setView({ name: 'skill', id: current.id })}>
              <Emoji name={current.emoji} size={32} /> {T.home.continueWith(skillText(current, lang).title)} <ArrowRight />
            </button>
          )}
          <div className="tiles">
            {SUBJECTS.filter((subject) => forChild(subject).length > 0 && stateOf(subject) !== 'hidden').map((subject) => {
              const skills = forChild(subject)
              const learnt = skills.filter((s) => child.skills[s.id]?.mastered).length
              const locked = stateOf(subject) === 'locked'
              return (
                <button key={subject} className={`tile ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => setView({ name: 'subject', subject })}>
                  <Emoji name={locked ? 'locked' : SUBJECT_EMOJI[subject]} size={56} />
                  <span>{T.home.subjects[subject]}</span>
                  <small>{locked ? T.access.subjectLocked(state.family.rewards.lessonsToOpen) : T.home.learntOf(learnt, skills.length)}</small>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {view.name === 'subject' && (
        <section className="card">
          <div className="chooser-top">
            <button className="secondary round" onClick={() => setView({ name: 'subjects' })} aria-label={T.common.back}>
              <ArrowLeft />
            </button>
            <h2>{T.home.subjects[view.subject]}</h2>
          </div>
          <p className="muted">{T.home.pickSkill}</p>
          <div className="path">
            {forChild(view.subject).map((def) => {
              const learnt = Boolean(child.skills[def.id]?.mastered)
              return (
                <button key={def.id} className={`path-skill ${learnt ? 'learnt' : ''} ${def.id === child.current ? 'open' : ''}`} onClick={() => openSkill(def.id)}>
                  <Emoji name={learnt ? 'tree' : def.emoji} size={48} />
                  <span>{skillText(def, lang).title}</span>
                  <small>{learnt ? T.home.learnt : T.home.level(def.stage + 1)}</small>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {view.name === 'skill' && shown && (
        <section className="card todays">
          <div className="chooser-top">
            <button className="secondary round" onClick={() => setView({ name: 'subject', subject: shown.subject })} aria-label={T.common.back}>
              <ArrowLeft />
            </button>
            <h2>{T.home.subjects[shown.subject]}</h2>
          </div>
          {stateOf(shown.subject) === 'open' ? (
            <>
              <Emoji name={child.skills[shown.id]?.mastered ? 'tree' : shown.emoji} size={120} />
              <p className="todays-title">{skillText(shown, lang).title}</p>
              <p className="muted">{child.skills[shown.id]?.mastered ? T.home.learnt : T.home.level(shown.stage + 1)}</p>
              <button className="big" onClick={() => onLesson(shown.id)}>
                {T.home.start}
              </button>
            </>
          ) : (
            <>
              <Emoji name="locked" size={100} />
              <p>{T.access.subjectLocked(state.family.rewards.lessonsToOpen)}</p>
            </>
          )}
        </section>
      )}
    </main>
  )
}
