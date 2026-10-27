import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { activeChild } from '@/app/state'
import { useStore } from '@/app/store'
import { useLang, useT } from '@/i18n'
import { VisualView } from '@/lesson/VisualView'
import { Emoji } from '@/shared/Emoji'
import { SKILLS, skillById, skillText } from '@/skills/index'
import { type Card, makeCards } from './pairs'
import './Memory.css'

/**
 * The memory game (Games tab): the child picks a skill they have learnt, and its questions become the cards. Turn two
 * cards; keep them when they are a question and its answer. New cards when all pairs are found. The time it may run
 * is the item's rule (open, or earned time: app/access.ts).
 */
export function MemoryGame() {
  const T = useT()
  const lang = useLang()
  const { state } = useStore()
  const child = activeChild(state)!
  const learnt = SKILLS.filter((s) => child.skills[s.id]?.mastered)
  const [skill, setSkill] = useState<string | null>(null)
  if (skill) return <Board key={skill} skill={skill} onBack={() => setSkill(null)} />
  return (
    <section className="card memory-pick">
      <p>{learnt.length ? T.games.chooseCards : T.games.noneLearnt}</p>
      <div className="tiles">
        {learnt.map((def) => (
          <button key={def.id} className="tile" onClick={() => setSkill(def.id)}>
            <Emoji name={def.emoji} size={48} />
            <span>{skillText(def, lang).title}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Board({ skill, onBack }: { skill: string; onBack: () => void }) {
  const T = useT()
  const lang = useLang()
  const def = skillById(skill)!
  const [cards, setCards] = useState<Card[]>(() => makeCards(def, Math.random, lang))
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<number[]>([])
  const pairs = cards.length / 2
  const turn = (i: number) => {
    if (open.includes(i) || found.includes(cards[i].pair) || open.length === 2) return
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
    setCards(makeCards(def, Math.random, lang))
    setFound([])
    setOpen([])
  }
  return (
    <section className="memory">
      <div className="row">
        <button className="secondary round" onClick={onBack} aria-label={T.common.back}>
          <ArrowLeft />
        </button>
        <p className="muted memory-help">
          {skillText(def, lang).title} · {T.games.help} {T.games.pairs(found.length, pairs)}
        </p>
      </div>
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
    </section>
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
