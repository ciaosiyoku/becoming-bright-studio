import { ArrowLeft, ArrowRight, Check, Delete, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ITEMS, type Subject } from '@/access/catalogue'
import { StatusBar } from '@/app/Shell'
import { useStudio } from '@/app/studio'
import { ReadIcon } from '@/audio/ReadIcon'
import { readOut, useCanSpeak } from '@/audio/say'
import { useStopSpeechOnLeave } from '@/audio/useSpeaking'
import type { Score } from '@/data/types'
import { type Lang, useLang, useT } from '@/i18n'
import { COUNTRIES, WORDS } from '@/lessons/data'
import { LADDERS, missionRound, passMark, questionLang, starsFor } from '@/lessons/ladder'
import { animalName, skillName } from '@/lessons/text'
import { answerLabel, type Choice, type Question, type Visual, workedLine } from '@/lessons/question'
import { type Answer, completeMission, levelOf, missionsFor } from '@/progress/progress'
import { computeStreak, milestoneAt } from '@/progress/streak'
import '@/progress/Streak.css'
import { useArea } from '@/progress/usage'
import { Emoji } from '@/shared/Emoji'
import { CountryFlag } from './Flag'
import './Missions.css'

/**
 * A mission, full screen: 10, 25 or 50 questions (the parent's choice) at the child's level, one try each. The tapped answer turns green when
 * right and red when wrong. After a wrong answer the right one is shown with why (the sum worked out, a reason),
 * and the child taps "Next" when ready; a parent can switch this off to keep the original "never shown" rule.
 * Either way a wrong answer goes into the review boxes and comes back on later days (lessons/review.ts); up to
 * a fifth of a round is such questions, marked "Try again". The score comes at the end.
 * Passed (70 % or more) and one of today's missions: ticked off with a star per 10 questions. Otherwise "not yet", and a new
 * try later with new questions in a new order. Either way the answers move the adaptive level and go into the
 * parents' report.
 */
export function MissionScreen({ subject, onClose }: { subject: Subject; onClose: () => void }) {
  const t = useT()
  const lang = useLang()
  const { now, today, stage, progress, settings, updateProgress } = useStudio()
  const isTodays = () => missionsFor(now, settings.access, settings.rewards.missionsPerDay).includes(subject) && !(progress.missions[today] ?? []).includes(subject)
  const [counts, setCounts] = useState(isTodays)
  const [level, setLevel] = useState(() => levelOf(progress, subject, stage))
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{ score: Score; levelAfter: number; milestone: number | null } | null>(null)
  useArea(`mission:${subject}`)

  const finish = (answers: Answer[]) => {
    let levelAfter = level
    let milestone: number | null = null
    updateProgress((p) => {
      const next = completeMission(p, subject, answers, { day: now, stage, counts })
      levelAfter = next.levels[subject] ?? level
      // Today's first star can lift the streak to a milestone (3, 7, 14, 30 … days): celebrate it.
      const before = computeStreak(p.stars, now)
      const after = computeStreak(next.stars, now)
      if (after.current > before.current) milestone = milestoneAt(after.current)
      return next
    })
    setResult({ score: { right: answers.filter((a) => a.right).length, total: answers.length }, levelAfter, milestone })
  }
  const again = () => {
    setCounts(isTodays())
    setLevel(result?.levelAfter ?? level)
    setResult(null)
    setRound((n) => n + 1)
  }
  const passed = result !== null && result.score.right >= passMark(result.score.total)

  return (
    <div className="mission-screen">
      <StatusBar
        left={
          <>
            <button className="secondary mission-back" onClick={onClose} aria-label={t.common.back}>
              <ArrowLeft /> <span>{t.common.back}</span>
            </button>
            <h2>
              <Emoji name={ITEMS[subject].emoji} size={40} /> {t.items[subject]}
            </h2>
          </>
        }
      />
      {result ? (
        <section className="card mission-done">
          <Emoji name={passed ? (counts ? 'glowstar' : 'sparkles') : 'seedling'} size={150} className={passed ? 'mission-star' : ''} />
          <h2>{passed ? t.mission.doneTitle : t.mission.notYetTitle}</h2>
          <p>{t.mission.score(result.score.right, result.score.total)}</p>
          {result.milestone && (
            <p className="streak-milestone">
              <Emoji name="fire" size={36} /> {t.streak.milestone(result.milestone)}
            </p>
          )}
          <p>{passed ? (counts ? t.mission.doneText(starsFor(result.score.total)) : t.mission.practiceText) : t.mission.notYetText(passMark(result.score.total))}</p>
          {result.levelAfter > level && <p className="pill">{t.mission.levelUp(skillName(LADDERS[subject][result.levelAfter], lang))}</p>}
          {result.levelAfter < level && <p className="pill">{t.mission.levelDown(skillName(LADDERS[subject][result.levelAfter], lang))}</p>}
          <div className="settings-buttons">
            {!passed && <button onClick={again}>{t.mission.tryAgain}</button>}
            <button className={passed ? '' : 'secondary'} onClick={onClose}>
              {passed && counts ? t.mission.backHome : t.common.back}
            </button>
          </div>
        </section>
      ) : (
        <Quiz key={round} subject={subject} level={level} count={settings.rewards.questionsPerMission} onDone={finish} />
      )}
    </div>
  )
}

/** A choice as words, for the parents' report ("fox", "France", "12"). */
function describe(c: Choice, lang: Lang): string {
  if (c.label !== undefined) return c.label
  const v = c.visual
  if (!v) return '?'
  if (v.kind === 'text') return v.text
  if (v.kind === 'photo') return `📷 ${v.alt}`
  if (v.kind === 'flag') return `flag of ${COUNTRIES.find((x) => x.id === v.id)?.name ?? v.id}`
  if (v.kind === 'emoji') return `🖼 ${v.name.startsWith('animal-') ? animalName(v.name.slice(7), lang) : (WORDS.find((w) => w.emoji === v.name)?.word ?? v.name.replace(/^fruit-/, '').replace(/-/g, ' '))}`
  return '?'
}

/** The ladder stage of the step a question came from (0 when unknown). */
const stageOf = (subject: Subject, step: string | undefined) => LADDERS[subject].find((x) => x.id === step)?.stage ?? 0

/** Every other question with a number answer is typed (from Stage 1, when the parent setting is on). */
function typedPlan(subject: Subject, round: Question[], on: boolean): boolean[] {
  let numeric = 0
  return round.map((q) => {
    if (!on || q.number === undefined || stageOf(subject, q.step) < 1) return false
    return numeric++ % 2 === 1
  })
}

function Quiz({ subject, level, count, onDone }: { subject: Subject; level: number; count: number; onDone: (answers: Answer[]) => void }) {
  const t = useT()
  const lang = useLang()
  const { progress, settings, today } = useStudio()
  // Questions in the app language; the English subject is always in English (it teaches English).
  const speech = questionLang(subject, lang)
  const [round] = useState(() => missionRound(subject, level, count, lang, progress.review, today))
  const [typedAt] = useState(() => typedPlan(subject, round, settings.lessons.typed))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  /** Wrong, and the right answer is shown: waits for "Next". */
  const [showing, setShowing] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const q = round[index]
  const answered = answers.length > index
  // The next question, or leaving the mission, stops what was being read.
  useStopSpeechOnLeave(index)
  const speaks = useCanSpeak(speech)

  const advance = (all: Answer[]) => {
    if (index + 1 >= round.length) return onDone(all)
    setIndex(index + 1)
    setPicked(null)
    setTyped('')
    setShowing(false)
  }
  const record = (right: boolean, given: string) => {
    const all = [...answers, { step: q.step ?? '', prompt: q.prompt, given, answer: describe(q.choices[q.answer], lang), right, question: q, lang: speech }]
    setAnswers(all)
    // Right: green for a moment, then the next question. Wrong: red, and the right answer with why stays on
    // screen until "Next" (or, when the parent chose to keep it hidden, the next question after a moment).
    if (right || !settings.lessons.showAnswer) setTimeout(() => advance(all), 900)
    else setShowing(true)
  }
  const choose = (i: number) => {
    if (answered) return
    setPicked(i)
    record(i === q.answer, describe(q.choices[i], lang))
  }
  const check = () => {
    if (answered || typed === '') return
    record(Number(typed) === q.number, typed)
  }
  const feedback = showing ? explanation(q, t) : null

  return (
    <section className="card quiz">
      {/* One segment per question (green right, red wrong), so 10 or 50 questions fit any screen. */}
      <div className="quiz-progress" role="progressbar" aria-valuemin={1} aria-valuemax={round.length} aria-valuenow={index + 1} aria-label={t.mission.progress(index + 1, round.length)}>
        <div className="quiz-dots">
          {round.map((_, i) => {
            const a = answers[i]
            return <i key={i} className={a ? (a.right ? 'done' : 'missed') : i === index ? 'now' : ''} />
          })}
        </div>
        <small>
          {index + 1} / {round.length}
        </small>
      </div>
      {q.review && (
        <p className="pill quiz-review-tag">
          <RotateCcw size={18} /> {t.mission.reviewTag}
        </p>
      )}
      <div className="quiz-ask">
        <p>{q.prompt}</p>
        {speaks && (
          <button className="secondary quiz-hear" onClick={() => readOut(q.spoken ?? q.prompt, speech)} aria-label={t.mission.hear}>
            <ReadIcon text={q.spoken ?? q.prompt} />
          </button>
        )}
      </div>
      {q.visual && (
        <div className="quiz-visual">
          <VisualView visual={q.visual} big />
        </div>
      )}
      {feedback && (
        <div className="quiz-feedback" role="status">
          <div className="quiz-why">
            {feedback.map((line, i) => (i === 0 ? <b key={i}>{line}</b> : <p key={i}>{line}</p>))}
          </div>
          {speaks && (
            <button className="secondary quiz-hear" onClick={() => readOut(feedback.join(' '), speech)} aria-label={t.mission.hear}>
              <ReadIcon text={feedback.join(' ')} />
            </button>
          )}
          <button className="quiz-next" onClick={() => advance(answers)} autoFocus>
            {t.mission.next} <ArrowRight />
          </button>
        </div>
      )}
      {typedAt[index] ? (
        <NumberPad value={typed} state={answered ? (answers[index].right ? 'right' : 'wrong') : null} maxLength={String(q.number).length + 2} onChange={setTyped} onCheck={check} />
      ) : (
        <div className={`quiz-choices ${q.choices.every((c) => c.label === undefined) ? 'pictures' : ''}`}>
          {q.choices.map((c, i) => {
            const shown = showing && i === q.answer
            return (
              <button
                key={i}
                className={`quiz-choice ${picked === i ? (i === q.answer ? 'right' : 'wrong') : shown ? 'right reveal' : ''} ${answered && picked !== i && !shown ? 'faded' : ''}`}
                onClick={() => choose(i)}
              >
                <ChoiceView choice={c} />
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

/** What is shown after a wrong answer: the right answer, the sum worked out, and why (lessons/question.ts). */
function explanation(q: Question, t: ReturnType<typeof useT>): string[] {
  const label = answerLabel(q)
  const worked = workedLine(q)
  return [label === null ? t.mission.answerShown : t.mission.answerIs(label), ...(worked ? [worked] : []), ...(q.explain ?? []).filter((line) => line !== worked)]
}

/** A number pad for a typed answer; a keyboard works too (digits, Backspace, Enter). */
function NumberPad({ value, state, maxLength, onChange, onCheck }: { value: string; state: 'right' | 'wrong' | null; maxLength: number; onChange: (v: string) => void; onCheck: () => void }) {
  const t = useT()
  const locked = state !== null
  const press = (d: string) => {
    if (!locked && value.length < maxLength) onChange(value === '0' ? d : value + d)
  }
  const back = () => {
    if (!locked) onChange(value.slice(0, -1))
  }
  // Re-attached on every render, so the keys always see the current value.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') back()
      else if (e.key === 'Enter') onCheck()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })
  return (
    <div className="number-pad">
      <output className={`typed-answer ${state ?? ''}`} aria-label={t.mission.typeAnswer}>
        {value || <span className="muted">?</span>}
      </output>
      <div className="number-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="secondary" onClick={() => press(d)} disabled={locked}>
            {d}
          </button>
        ))}
        <button className="secondary" onClick={back} disabled={locked || value === ''} aria-label={t.mission.deleteDigit}>
          <Delete />
        </button>
        <button className="secondary" onClick={() => press('0')} disabled={locked}>
          0
        </button>
        <button onClick={onCheck} disabled={locked || value === ''} aria-label={t.mission.check}>
          <Check />
        </button>
      </div>
    </div>
  )
}

function ChoiceView({ choice }: { choice: Choice }) {
  if (choice.visual) return <VisualView visual={choice.visual} />
  return <span className="quiz-label">{choice.label}</span>
}

function VisualView({ visual, big = false }: { visual: Visual; big?: boolean }) {
  if (visual.kind === 'text') return <span className={big ? 'quiz-sum' : 'quiz-label'}>{visual.text}</span>
  if (visual.kind === 'flag') return <CountryFlag id={visual.id} width={big ? 220 : 140} />
  if (visual.kind === 'photo') return <img className={big ? 'quiz-photo big' : 'quiz-photo'} src={`${import.meta.env.BASE_URL}${visual.src}`} alt={visual.alt} />
  if (visual.kind === 'pattern') {
    return (
      <span className="quiz-pattern">
        {visual.items.map((name, i) => (
          <Emoji key={i} name={name} size={60} />
        ))}
        <b className="quiz-gap">?</b>
      </span>
    )
  }
  if (visual.count) {
    return (
      <span className="quiz-count">
        {Array.from({ length: visual.count }, (_, i) => (
          <Emoji key={i} name={visual.name} size={56} />
        ))}
      </span>
    )
  }
  return <Emoji name={visual.name} size={big ? 140 : 80} />
}
