import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activeChild, updateChild } from '@/app/state'
import { useStore } from '@/app/store'
import { useLang, useT } from '@/i18n'
import { VisualView } from '@/lesson/VisualView'
import { Emoji } from '@/shared/Emoji'
import { skillById, skillText } from '@/skills/index'
import { type Card, makeCards, secondsLeft } from './pairs'
import './Memory.css'

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/**
 * The memory game of a learnt skill: turn two cards, keep them when they are a question and its answer. Runs for the
 * time the skill has left (5 minutes in all, kept per child), then stops. A new set of cards when all are found.
 */
export function Memory({ skill, onClose }: { skill: string; onClose: () => void }) {
  const T = useT()
  const lang = useLang()
  const def = skillById(skill)!
  const { state, update } = useStore()
  const child = activeChild(state)!
  const [left, setLeft] = useState(() => secondsLeft(child.games[skill]))
  const [cards, setCards] = useState<Card[]>(() => makeCards(def))
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<number[]>([])
  const running = left > 0

  // One second at a time, saved to the child's record as it goes (so leaving early keeps the rest for later).
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setLeft((s) => s - 1)
      update((s) => updateChild(s, child.id, (c) => ({ ...c, games: { ...c.games, [skill]: (c.games[skill] ?? 0) + 1 } })))
    }, 1000)
    return () => clearInterval(t)
  }, [running, child.id, skill, update])

  const pairs = cards.length / 2
  const turn = (i: number) => {
    if (left <= 0 || open.includes(i) || found.includes(cards[i].pair) || open.length === 2) return
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return
    const [a, b] = next.map((n) => cards[n])
    if (a.pair === b.pair) {
      setFound([...found, a.pair])
      setOpen([])
    } else setTimeout(() => setOpen([]), 1100)
  }
  const fresh = () => {
    setCards(makeCards(def))
    setFound([])
    setOpen([])
  }

  return (
    <main className="memory">
      <header className="lesson-top">
        <button className="secondary" onClick={onClose} aria-label={T.common.back}>
          <ArrowLeft />
        </button>
        <h1>
          <Emoji name={def.emoji} size={40} /> {skillText(def, lang).title}
        </h1>
        <span className="pill">{T.games.left(clock(Math.max(0, left)))}</span>
      </header>
      {left <= 0 ? (
        <section className="card memory-end">
          <Emoji name="glowstar" size={120} />
          <h2>{T.games.timeUp}</h2>
          <button className="big" onClick={onClose}>
            {T.lesson.backHome}
          </button>
        </section>
      ) : (
        <>
          <p className="muted memory-help">
            {T.games.help} {T.games.pairs(found.length, pairs)}
          </p>
          <div className={`memory-board n${cards.length}`}>
            {cards.map((c, i) => {
              const shown = open.includes(i) || found.includes(c.pair)
              return (
                <button key={i} className={`memory-card ${shown ? 'shown' : ''} ${found.includes(c.pair) ? 'found' : ''}`} onClick={() => turn(i)} aria-label={shown ? undefined : '?'}>
                  {shown ? <Face card={c} /> : <Emoji name="seedling" size={44} />}
                </button>
              )
            })}
          </div>
          {found.length === pairs && (
            <div className="row center">
              <b>{T.games.allFound}</b>
              <button onClick={fresh}>{T.games.again}</button>
            </div>
          )}
        </>
      )}
    </main>
  )
}

function Face({ card }: { card: Card }) {
  const f = card.face
  if (f.kind === 'text') return <span className="memory-text">{f.text}</span>
  if (f.kind === 'visual')
    return (
      <span className="memory-visual">
        <VisualView visual={f.visual} />
      </span>
    )
  return (
    <span className="memory-visual">
      {f.choice.emoji && <Emoji name={f.choice.emoji} size={56} />}
      {f.choice.label && <span className="memory-text">{f.choice.label}</span>}
    </span>
  )
}
