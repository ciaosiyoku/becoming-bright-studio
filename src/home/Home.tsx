import { ArrowLeft, ArrowRight } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { subjectState } from '@/app/access'
import { activeChild, updateChild } from '@/app/state'
import { lastDays, streaks } from '@/app/streak'
import { useToday } from '@/shared/useToday'
import { useStore } from '@/app/store'
import { backupDue } from '@/data/backup'
import { earnedIds, STICKERS, totalStars } from '@/app/stickers'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { suitsAge } from '@/skills/ages'
import { bySubject, skillById, SKILLS, skillText, SUBJECT_EMOJI, SUBJECTS } from '@/skills/index'
import { Sunny } from '@/shared/Sunny'
import { Garden, SUBJECT_COLOURS } from './Garden'
import { roadPath, stoneSpot } from './road'
import { stickerText } from './stickerText'
import type { Subject } from '@/skills/types'
import './Home.css'

/** Where the Learn tab is: all subjects, one subject's skills, or one skill ready to start. */
type View = { name: 'subjects' } | { name: 'subject'; subject: Subject } | { name: 'skill'; id: string } | { name: 'stickers' }

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
  // Each view starts at its top (the tab scrolls as one page, App's Shell): a subject, a skill or the stickers.
  const page = useRef<HTMLElement>(null)
  useEffect(() => {
    page.current?.closest('.shell-main')?.scrollTo({ top: 0 })
  }, [view])
  /** Stepping stones per row: 4 on a tablet, 2 on a phone. */
  const [perRow] = useState(() => (globalThis.matchMedia?.('(max-width: 600px)').matches ? 2 : 4))
  const openSkill = (id: string) => {
    update((s) => updateChild(s, child.id, (c) => ({ ...c, current: id })))
    setView({ name: 'skill', id })
  }
  const shown = view.name === 'skill' ? skillById(view.id) : undefined

  // The garden (a tree per learnt skill, oldest first), stars, stickers and today's goal (passed lessons).
  const trees = SKILLS.filter((s) => child.skills[s.id]?.mastered)
    .sort((a, b) => (child.skills[a.id].masteredOn ?? '').localeCompare(child.skills[b.id].masteredOn ?? ''))
    .map((s) => s.subject)
  const stars = totalStars(child)
  const stickers = earnedIds(child, SKILLS, today)
  const goal = Math.max(1, state.family.rewards.lessonsToOpen)
  const passedToday = Math.min(goal, child.passes[today] ?? 0)
  /** Stars for a learnt skill: 3 after 5 of 5, 2 after 4 of 5, 1 when the last try was lower. */
  const starsOf = (id: string) => {
    const p = child.skills[id]
    if (!p?.mastered) return 0
    return (p.lastScore ?? 0) >= 5 ? 3 : (p.lastScore ?? 0) >= 4 ? 2 : 1
  }

  return (
    <main className="page" ref={page}>
      {view.name === 'subjects' && (
        <section className="hello">
          <Sunny mood="happy" size={96} />
          <div className="hello-bubble">
            <b>{T.home.goal}</b>
            <span>{passedToday >= goal ? T.home.goalDone : T.home.goalLeft(goal - passedToday)}</span>
          </div>
          <span className="stars-chip">
            <StarIcon /> {T.home.stars(stars)}
          </span>
        </section>
      )}
      {view.name === 'subjects' && (
        <section className="card garden-card">
          <Garden trees={trees} label={`${T.home.garden}: ${T.home.trees(trees.length)}`} />
          <span className="garden-name">
            <b>{T.home.garden}</b> {T.home.trees(trees.length)}
          </span>
          <span className="goal" aria-label={`${T.home.goal}: ${passedToday} / ${goal}`}>
            <b>{T.home.goal}</b>
            <span className="goal-dots" aria-hidden="true">
              {Array.from({ length: goal }, (_, i) => (
                <i key={i} className={i < passedToday ? 'done' : ''} />
              ))}
            </span>
          </span>
          <button className="stickers-button secondary" onClick={() => setView({ name: 'stickers' })}>
            <Emoji name="glowstar" size={36} /> {T.home.stickers} · {T.home.stickersOf(stickers.length, STICKERS.length)}
          </button>
        </section>
      )}

      {view.name === 'stickers' && (
        <section className="card">
          <div className="chooser-top">
            <button className="secondary round" onClick={() => setView({ name: 'subjects' })} aria-label={T.common.back}>
              <ArrowLeft />
            </button>
            <h2>{T.home.stickers}</h2>
            <span className="pill">{T.home.stickersOf(stickers.length, STICKERS.length)}</span>
          </div>
          <ul className="sticker-book">
            {STICKERS.map((st) => {
              const got = stickers.includes(st.id)
              return (
                <li key={st.id} className={`sticker ${got ? 'got' : ''}`}>
                  <Emoji name={st.emoji} size={80} />
                  <span>{stickerText(T, st.rule)}</span>
                  {!got && <small>{T.home.notYet}</small>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

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
            <button className="big continue-big" onClick={() => setView({ name: 'skill', id: current.id })}>
              <Emoji name={current.emoji} size={48} />
              <span>{T.home.continueWith(skillText(current, lang).title)}</span>
              <ArrowRight />
            </button>
          )}
          <div className="subject-list">
            {SUBJECTS.filter((subject) => forChild(subject).length > 0 && stateOf(subject) !== 'hidden').map((subject) => {
              const skills = forChild(subject)
              const learnt = skills.filter((s) => child.skills[s.id]?.mastered).length
              const locked = stateOf(subject) === 'locked'
              const colours = SUBJECT_COLOURS[subject]
              const vars = { '--subject': colours.main, '--subject-soft': colours.soft, '--subject-deep': colours.deep } as CSSProperties
              return (
                <button key={subject} className={`subject-card ${locked ? 'locked' : ''}`} style={vars} disabled={locked} onClick={() => setView({ name: 'subject', subject })}>
                  <span className="subject-icon">
                    <Emoji name={locked ? 'locked' : SUBJECT_EMOJI[subject]} size={52} />
                  </span>
                  <span className="subject-text">
                    <b>{T.home.subjects[subject]}</b>
                    <span className="subject-bar" aria-hidden="true">
                      <i style={{ width: `${skills.length ? Math.round((100 * learnt) / skills.length) : 0}%` }} />
                    </span>
                  </span>
                  <small>{locked ? T.access.subjectLocked(state.family.rewards.lessonsToOpen) : T.home.learntOf(learnt, skills.length)}</small>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {view.name === 'subjects' && (
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
          {/* The skills as stepping stones on a winding road, in teaching order, like a board game: left to right,
              then back. Sunny waits by the chosen skill. */}
          <Stones
            perRow={perRow}
            colours={SUBJECT_COLOURS[view.subject]}
            stones={forChild(view.subject).map((def) => ({
              id: def.id,
              emoji: child.skills[def.id]?.mastered ? 'tree' : def.emoji,
              title: skillText(def, lang).title,
              learnt: Boolean(child.skills[def.id]?.mastered),
              stars: starsOf(def.id),
              chosen: def.id === child.current,
              level: T.home.level(def.stage + 1),
            }))}
            starsLabel={T.home.stars}
            onOpen={openSkill}
          />
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

interface Stone {
  id: string
  emoji: string
  title: string
  learnt: boolean
  stars: number
  chosen: boolean
  level: string
}

function Stones({ stones, perRow, colours, starsLabel, onOpen }: { stones: Stone[]; perRow: number; colours: { main: string; soft: string }; starsLabel: (n: number) => string; onOpen: (id: string) => void }) {
  const rows = Math.ceil(stones.length / perRow)
  const vars = { '--subject': colours.main, '--subject-soft': colours.soft, '--rows': rows } as CSSProperties
  return (
    <div className="stones" style={vars}>
      <svg className="stones-road" viewBox={`0 0 100 ${rows * 100}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={roadPath(stones.length, perRow)} className="road" vectorEffect="non-scaling-stroke" />
        <path d={roadPath(stones.length, perRow)} className="road-dashes" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol>
        {stones.map((st, i) => {
          const { row, col } = stoneSpot(i, perRow)
          return (
            <li key={st.id} style={{ left: `${((col + 0.5) * 100) / perRow}%`, top: `calc(${row} * var(--row-height))` }}>
              <button className={`stone ${st.learnt ? 'learnt' : ''} ${st.chosen ? 'open' : ''}`} onClick={() => onOpen(st.id)}>
                <span className="stone-face">
                  <Emoji name={st.emoji} size={52} />
                </span>
                <span className="stone-title">{st.title}</span>
                {st.learnt ? (
                  <span className="stone-stars" aria-label={starsLabel(st.stars)}>
                    {[0, 1, 2].map((k) => (
                      <StarIcon key={k} off={k >= st.stars} />
                    ))}
                  </span>
                ) : (
                  <small>{st.level}</small>
                )}
              </button>
              {st.chosen && <Sunny mood="cheer" size={64} className="stone-sunny" />}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** A star (gold, or a grey outline for one not earned yet). */
function StarIcon({ off = false }: { off?: boolean }) {
  return (
    <svg className={`star-icon ${off ? 'off' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" />
    </svg>
  )
}
