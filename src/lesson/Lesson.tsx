import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { earnedMinutes, subjectState } from '@/app/access'
import { activeChild, isoDate, updateChild } from '@/app/state'
import { earnedIds, newStickers, type Sticker } from '@/app/stickers'
import { stickerText } from '@/home/stickerText'
import { useToday } from '@/shared/useToday'
import { useStore } from '@/app/store'
import { type Lang, useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { speak, stopSpeaking, useCanSpeak } from '@/shared/speak'
import { teachCard } from '@/skills/generate'
import { suitsAge } from '@/skills/ages'
import { bySubject, itemWords, skillById, SKILLS, skillLang, skillText, SUBJECTS } from '@/skills/index'
import type { Choice, Item, SkillDef, Subject } from '@/skills/types'
import { useSkills } from '@/skills/useSkills'
import { NumberLine } from './NumberLine'
import { type CheckAnswer, checksOf, finishSession, GUIDED, newSession, resultOf, stepOf } from './session'
import { playSound } from '@/shared/sounds'
import { Sunny } from '@/shared/Sunny'
import { VisualView } from './VisualView'
import './Lesson.css'

/** "Next" waits this long after an answer, so the reason is seen (it never moves on by itself). */
const NEXT_DELAY_MS = 1200

/** One session of one skill: teach card, two guided tries, five checks, result (session.ts). */
export function Lesson({ skill, onClose, onLesson }: { skill: string; onClose: () => void; onLesson: (skill: string) => void }) {
  const T = useT()
  // The skill's questions are loaded when the lesson opens (skills/index.ts: loadSkill), from the device once saved.
  const loaded = useSkills([skill])
  if (loaded === null) return <main className="lesson" />
  if (loaded === 'error')
    return (
      <main className="lesson">
        <section className="card lesson-card">
          <p>{T.parent.updateOffline}</p>
          <div className="row center">
            <button className="big" onClick={onClose}>
              {T.common.back}
            </button>
          </div>
        </section>
      </main>
    )
  return <LessonSession def={loaded[0]} onClose={onClose} onLesson={onLesson} />
}

function LessonSession({ def, onClose, onLesson }: { def: SkillDef; onClose: () => void; onLesson: (skill: string) => void }) {
  const T = useT()
  const skill = def.id
  const appLang = useLang()
  const lang = skillLang(def, appLang)
  const { state, update } = useStore()
  const child = activeChild(state)!
  // As many checks as the grown-ups chose (5, 7 or 10), fixed for the whole lesson.
  const [session] = useState(() => newSession(def, Math.random, lang, checksOf(state.family.rewards.checks)))
  const [phase, setPhase] = useState<'teach' | 'items' | 'result'>('teach')
  const [index, setIndex] = useState(0)
  const [checks, setChecks] = useState<CheckAnswer[]>([])
  /** Stickers this lesson earned (shown on the result). */
  const [stickers, setStickers] = useState<Sticker[]>([])
  useEffect(() => stopSpeaking, [])

  const step = stepOf(index, session.checks)
  const answered = (a: CheckAnswer) => {
    const all = step.kind === 'check' ? [...checks, a] : checks
    setChecks(all)
    return all
  }
  const next = (all: CheckAnswer[]) => {
    if (index + 1 < session.items.length) return setIndex(index + 1)
    const now = new Date()
    const day = isoDate(now)
    setStickers(newStickers(earnedIds(child, SKILLS, day), earnedIds(finishSession(child, skill, all, now), SKILLS, day)))
    update((s) => updateChild(s, child.id, (c) => finishSession(c, skill, all, now)))
    setPhase('result')
  }

  return (
    <main className="lesson">
      <header className="lesson-top">
        <button className="secondary" onClick={onClose} aria-label={T.common.back}>
          <ArrowLeft />
        </button>
        <h1>
          <Emoji name={def.emoji} size={40} /> {skillText(def, appLang).title}
        </h1>
        {phase === 'items' && <Steps index={index} total={session.items.length} checks={checks} label={step.kind === 'guided' ? T.lesson.guided(step.n, step.of) : T.lesson.check(step.n, step.of)} />}
      </header>
      {phase === 'teach' && <TeachCard def={def} lang={lang} onReady={() => setPhase('items')} />}
      {phase === 'items' && <Question key={index} skill={skill} item={session.items[index]} lang={lang} isCheck={step.kind === 'check'} onAnswered={answered} onNext={next} />}
      {phase === 'result' && <Result skill={skill} checks={checks} stickers={stickers} onClose={onClose} onLesson={onLesson} />}
    </main>
  )
}

/**
 * Where the child is: one dot per question (2 practice tries, then 5 checks). A right check gets a star; practice
 * tries never count, so they never get one. The words ("Check 2 of 10") are there for screen readers.
 */
function Steps({ index, total, checks, label }: { index: number; total: number; checks: CheckAnswer[]; label: string }) {
  return (
    <ol className="steps" aria-label={label}>
      {Array.from({ length: total }, (_, i) => {
        const star = i >= GUIDED && checks[i - GUIDED]?.right
        const state = i === index ? 'now' : i < index ? (star ? 'star' : 'done') : ''
        return (
          <li key={i} className={`step ${state} ${i < GUIDED ? 'practice' : ''}`}>
            {state === 'star' && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" />
              </svg>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** The teach card: one picture or number line, one sentence, read aloud. */
function TeachCard({ def, lang, onReady }: { def: SkillDef; lang: Lang; onReady: () => void }) {
  const T = useT()
  const card = teachCard(def, lang)
  const sentence = itemWords(def, card, lang).teach
  const canSpeak = useCanSpeak(lang)
  useEffect(() => speak(sentence, lang), [sentence, lang])
  return (
    <section className="card lesson-card teach">
      <Sunny mood="happy" size={110} className="sunny-teach" />
      <span className="pill">{T.lesson.teach}</span>
      {card.visual && <VisualView visual={card.visual} big />}
      {card.line && <NumberLine line={card.line} />}
      <p className="teach-sentence">{sentence}</p>
      <div className="row center">
        {canSpeak && (
          <button className="secondary" onClick={() => speak(sentence, lang)}>
            <Volume2 /> {T.lesson.hear}
          </button>
        )}
        <button
          className="big"
          onClick={() => {
            playSound('tap')
            onReady()
          }}
        >
          {T.lesson.ready} <ArrowRight />
        </button>
      </div>
    </section>
  )
}

/** A choice as words, for the reason line and the parent screen ("4", "an"). */
const describe = (c: Choice) => c.label ?? c.emoji?.replace(/^(animal|fruit)-/, '').replace(/-/g, ' ') ?? '?'

/**
 * One question. After the answer, right or wrong: the right answer turns green, the reason (with its number line)
 * shows and is read aloud, and "Next" can be tapped after a moment. Nothing moves on by itself.
 */
function Question({ skill, item, lang, isCheck, onAnswered, onNext }: { skill: string; item: Item; lang: Lang; isCheck: boolean; onAnswered: (a: CheckAnswer) => CheckAnswer[]; onNext: (all: CheckAnswer[]) => void }) {
  const T = useT()
  const def = skillById(skill)!
  const words = itemWords(def, item, lang)
  const canSpeak = useCanSpeak(lang)
  /** Sunny cheers a right answer, unless the grown-ups chose a calm smile. */
  const cheers = useStore().state.family.cheers
  const [picked, setPicked] = useState<number | null>(null)
  const [all, setAll] = useState<CheckAnswer[] | null>(null)
  const [nextReady, setNextReady] = useState(false)
  useEffect(() => speak(words.say, lang), [words.say, lang])
  useEffect(() => {
    if (picked === null) return
    const t = setTimeout(() => setNextReady(true), NEXT_DELAY_MS)
    return () => clearTimeout(t)
  }, [picked])

  const rightLabel = describe(item.choices[item.answer])
  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const right = i === item.answer
    setAll(onAnswered({ right, prompt: words.prompt, given: describe(item.choices[i]), answer: rightLabel }))
    playSound(right ? 'right' : 'miss')
    // After a miss, Sunny says "Let's look together" before the answer and its reason.
    speak(`${right ? T.lesson.yes : `${T.lesson.lookTogether} ${T.lesson.answerIs(rightLabel)}`} ${words.reason}`, lang)
  }
  const right = picked === item.answer
  return (
    <div className="lesson-stage">
      <Sunny mood={picked === null ? 'think' : right && cheers ? 'cheer' : 'happy'} size={150} className="sunny-side" />
    <section className="card lesson-card">
      <div className="ask">
        <p>{words.prompt}</p>
        {canSpeak && (
          <button className="secondary round" onClick={() => speak(words.say, lang)} aria-label={T.lesson.hear}>
            <Volume2 />
          </button>
        )}
      </div>
      {item.visual && <VisualView visual={item.visual} big />}
      <div className={`choices ${item.choices.every((c) => c.emoji) ? 'pictures' : ''} ${item.choices.length === 2 ? 'two' : ''} ${item.choices.length === 4 ? 'four' : ''} ${item.choices.some((c) => (c.label?.length ?? 0) > 12) ? 'long' : ''}`}>
        {item.choices.map((c, i) => {
          const state = picked === null ? '' : i === item.answer ? 'right' : i === picked ? 'wrong' : 'faded'
          return (
            <button key={i} className={`choice ${state}`} onClick={() => choose(i)} disabled={picked !== null}>
              {c.emoji && <Emoji name={c.emoji} size={88} />}
              {c.label && <span>{c.label}</span>}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className={`feedback ${right ? 'is-right' : 'is-wrong'}`} role="status">
          {right && isCheck && <span className="star-badge">{T.lesson.star}</span>}
          <div className="feedback-words">
            {!right && <small>{T.lesson.lookTogether}</small>}
            <b>{right ? T.lesson.yes : T.lesson.answerIs(rightLabel)}</b>
            <p>{words.reason}</p>
          </div>
          {item.line && <NumberLine line={item.line} />}
          <button className="big" onClick={() => all && onNext(all)} disabled={!nextReady}>
            {T.lesson.next} <ArrowRight />
          </button>
        </div>
      )}
    </section>
    </div>
  )
}

/** The end of the session: mastered (a tree, and the memory game when games are allowed) or "let's practise again". */
function Result({ skill, checks, stickers, onClose, onLesson }: { skill: string; checks: CheckAnswer[]; stickers: Sticker[]; onClose: () => void; onLesson: (skill: string) => void }) {
  const T = useT()
  const today = useToday()
  const lang = useLang()
  const { state, update } = useStore()
  const def = skillById(skill)!
  const { right, mastered } = resultOf(checks)
  const child = activeChild(state)!
  /** The skills of a subject for the child's age that are not learnt yet, in teaching order. */
  const toLearn = (subject: Subject) => bySubject(subject).filter((s) => suitsAge(s, child.age) && s.id !== def.id && !child.skills[s.id]?.mastered)
  // What comes next (the child may still choose another): the next skill of this subject for the child's age, or
  // one the child skipped; when the subject is done, the first skill to learn in the next open subject.
  const here = toLearn(def.subject)
  const sameSubject = here.find((s) => s.order > def.order) ?? here[0]
  const others = [...SUBJECTS.slice(SUBJECTS.indexOf(def.subject) + 1), ...SUBJECTS.slice(0, SUBJECTS.indexOf(def.subject))]
  const nextSubject = sameSubject ? undefined : others.find((sub) => subjectState(state.family, child, sub, today) === 'open' && toLearn(sub).length > 0)
  const upcoming = sameSubject?.id ?? (nextSubject ? toLearn(nextSubject)[0].id : null)
  const goNext = (id: string) => {
    update((s) => updateChild(s, child.id, (c) => ({ ...c, current: id })))
    onLesson(id)
  }
  const upcomingDef = upcoming ? skillById(upcoming) : undefined
  // The minutes this lesson earned (a passed lesson; none once today's most is reached).
  const gained = mastered ? earnedMinutes(child, state.family, today) - earnedMinutes({ ...child, passes: { ...child.passes, [today]: (child.passes[today] ?? 1) - 1 } }, state.family, today) : 0
  // A short tune as the tree grows.
  useEffect(() => {
    if (mastered) playSound('done')
  }, [mastered])
  return (
    <section className="card lesson-card result">
      <div className="result-scene">
        <Emoji name={mastered ? 'tree' : 'seedling'} size={150} className={mastered ? 'grow' : ''} />
        <Sunny mood={mastered && state.family.cheers ? 'cheer' : 'happy'} size={120} className="sunny-result" />
      </div>
      <h2>{mastered ? T.lesson.learntTitle : T.lesson.notYetTitle}</h2>
      <p className="result-stars" aria-label={T.lesson.score(right, checks.length)}>
        {Array.from({ length: checks.length }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" className={i < right ? 'got' : ''} aria-hidden="true">
            <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" />
          </svg>
        ))}
      </p>
      <p>{T.lesson.score(right, checks.length)}</p>
      <p>{mastered ? T.lesson.learntText(skillText(def, lang).title) : T.lesson.notYetText}</p>
      {/* Up to three new stickers here; the sticker book has them all. */}
      {stickers.slice(0, 3).map((st) => (
        <p key={st.id} className="new-sticker">
          <Emoji name={st.emoji} size={72} />
          <span>
            <b>{T.lesson.newSticker}</b>
            <small>{stickerText(T, st.rule)}</small>
          </span>
        </p>
      ))}
      {stickers.length > 3 && <p className="pill">{T.lesson.moreStickers(stickers.length - 3)}</p>}
      {gained > 0 && (
        <p className="earned-now">
          <Emoji name="clock" size={36} /> {T.access.earnedNow(gained)}
        </p>
      )}
      <div className="row center">
        {mastered && upcomingDef && (
          <button className="big" onClick={() => goNext(upcomingDef.id)}>
            {nextSubject ? T.lesson.nextSubject(T.home.subjects[nextSubject], skillText(upcomingDef, lang).title) : T.lesson.nextUp(skillText(upcomingDef, lang).title)}
          </button>
        )}
        <button className={mastered && upcomingDef ? 'secondary' : 'big'} onClick={onClose}>
          {T.lesson.backHome}
        </button>
      </div>
    </section>
  )
}
