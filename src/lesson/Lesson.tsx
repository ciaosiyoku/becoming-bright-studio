import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activeChild, updateChild } from '@/app/state'
import { useStore } from '@/app/store'
import { type Lang, useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { speak, stopSpeaking, useCanSpeak } from '@/shared/speak'
import { teachCard } from '@/skills/generate'
import { itemWords, skillById, skillLang, SKILLS, skillText } from '@/skills/index'
import type { Choice, Item } from '@/skills/types'
import { NumberLine } from './NumberLine'
import { type CheckAnswer, CHECKS, finishSession, newSession, nextSkill, resultOf, stepOf } from './session'
import { VisualView } from './VisualView'
import './Lesson.css'

/** "Next" waits this long after an answer, so the reason is seen (it never moves on by itself). */
const NEXT_DELAY_MS = 1200

/** One session of one skill: teach card, two guided tries, five checks, result (session.ts). */
export function Lesson({ skill, onClose }: { skill: string; onClose: () => void }) {
  const T = useT()
  const def = skillById(skill)!
  const appLang = useLang()
  const lang = skillLang(def, appLang)
  const { state, update } = useStore()
  const child = activeChild(state)!
  const [session] = useState(() => newSession(def))
  const [phase, setPhase] = useState<'teach' | 'items' | 'result'>('teach')
  const [index, setIndex] = useState(0)
  const [checks, setChecks] = useState<CheckAnswer[]>([])
  useEffect(() => stopSpeaking, [])

  const step = stepOf(index)
  const answered = (a: CheckAnswer) => {
    const all = step.kind === 'check' ? [...checks, a] : checks
    setChecks(all)
    return all
  }
  const next = (all: CheckAnswer[]) => {
    if (index + 1 < session.items.length) return setIndex(index + 1)
    update((s) => updateChild(s, child.id, (c) => finishSession(c, skill, all, new Date())))
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
        {phase === 'items' && <span className="pill">{step.kind === 'guided' ? T.lesson.guided(step.n, step.of) : T.lesson.check(step.n, step.of)}</span>}
      </header>
      {phase === 'teach' && <TeachCard skill={skill} lang={lang} onReady={() => setPhase('items')} />}
      {phase === 'items' && <Question key={index} skill={skill} item={session.items[index]} lang={lang} onAnswered={answered} onNext={next} />}
      {phase === 'result' && <Result skill={skill} checks={checks} onClose={onClose} />}
    </main>
  )
}

/** The teach card: one picture or number line, one sentence, read aloud. */
function TeachCard({ skill, lang, onReady }: { skill: string; lang: Lang; onReady: () => void }) {
  const T = useT()
  const def = skillById(skill)!
  const card = teachCard(def)
  const sentence = itemWords(def, card, lang).teach
  const canSpeak = useCanSpeak(lang)
  useEffect(() => speak(sentence, lang), [sentence, lang])
  return (
    <section className="card lesson-card teach">
      <span className="pill">{T.lesson.teach}</span>
      <VisualView visual={card.visual} big />
      {card.line && <NumberLine line={card.line} />}
      <p className="teach-sentence">{sentence}</p>
      <div className="row center">
        {canSpeak && (
          <button className="secondary" onClick={() => speak(sentence, lang)}>
            <Volume2 /> {T.lesson.hear}
          </button>
        )}
        <button className="big" onClick={onReady}>
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
function Question({ skill, item, lang, onAnswered, onNext }: { skill: string; item: Item; lang: Lang; onAnswered: (a: CheckAnswer) => CheckAnswer[]; onNext: (all: CheckAnswer[]) => void }) {
  const T = useT()
  const def = skillById(skill)!
  const words = itemWords(def, item, lang)
  const canSpeak = useCanSpeak(lang)
  const [picked, setPicked] = useState<number | null>(null)
  const [all, setAll] = useState<CheckAnswer[] | null>(null)
  const [nextReady, setNextReady] = useState(false)
  useEffect(() => speak(words.prompt, lang), [words.prompt, lang])
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
    speak(`${right ? T.lesson.yes : T.lesson.answerIs(rightLabel)} ${words.reason}`, lang)
  }
  const right = picked === item.answer
  return (
    <section className="card lesson-card">
      <div className="ask">
        <p>{words.prompt}</p>
        {canSpeak && (
          <button className="secondary round" onClick={() => speak(words.prompt, lang)} aria-label={T.lesson.hear}>
            <Volume2 />
          </button>
        )}
      </div>
      <VisualView visual={item.visual} big />
      <div className={`choices ${item.choices.every((c) => c.emoji) ? 'pictures' : ''}`}>
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
          <div className="feedback-words">
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
  )
}

/** The end of the session: mastered (a tree) or "let's practise again" (a seedling). */
function Result({ skill, checks, onClose }: { skill: string; checks: CheckAnswer[]; onClose: () => void }) {
  const T = useT()
  const lang = useLang()
  const { state } = useStore()
  const def = skillById(skill)!
  const { right, mastered } = resultOf(checks)
  const upcoming = nextSkill(
    activeChild(state)!,
    SKILLS.map((s) => s.id),
  )
  const upcomingDef = upcoming ? skillById(upcoming) : undefined
  return (
    <section className="card lesson-card result">
      <Emoji name={mastered ? 'tree' : 'seedling'} size={150} className={mastered ? 'grow' : ''} />
      <h2>{mastered ? T.lesson.learntTitle : T.lesson.notYetTitle}</h2>
      <p>{T.lesson.score(right, CHECKS)}</p>
      <p>{mastered ? T.lesson.learntText(skillText(def, lang).title) : T.lesson.notYetText}</p>
      {mastered && upcomingDef && <p className="pill">{T.lesson.nextUp(skillText(upcomingDef, lang).title)}</p>}
      <button className="big" onClick={onClose}>
        {T.lesson.backHome}
      </button>
    </section>
  )
}
