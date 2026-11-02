import { useEffect, useState } from 'react'
import { useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { LevelBar } from '../LevelBar'
import { useLevel } from '../levels'
import { sequenceLevel } from './sequence'

// Repeat the pattern: the pads light up one after another; the child taps them in the same order. Each round adds
// one more; reaching the level's length wins. Trains working memory and attention.

const PADS = [
  { emoji: 'star', colour: '#f2c230' },
  { emoji: 'heart', colour: '#e2557e' },
  { emoji: 'droplet', colour: '#5b6cf0' },
  { emoji: 'seedling', colour: '#22a06b' },
  { emoji: 'moon', colour: '#8b5cf6' },
  { emoji: 'fire', colour: '#e08a1e' },
]


export function SequenceGame() {
  const { level, up, down } = useLevel('sequence')
  const [round, setRound] = useState(0)
  const next = (change: () => void) => {
    change()
    setRound((n) => n + 1)
  }
  return <Pads key={`${level}-${round}`} level={level} onNext={() => next(up)} onEasier={() => next(down)} />
}

function Pads({ level, onNext, onEasier }: { level: number; onNext: () => void; onEasier: () => void }) {
  const T = useT()
  const { pads, length } = sequenceLevel(level)
  const [order] = useState(() => Array.from({ length }, () => Math.floor(Math.random() * pads)))
  const [shown, setShown] = useState(2) // how many of the order this round asks for
  const [lit, setLit] = useState<number | null>(null)
  const [watching, setWatching] = useState(true)
  const [typed, setTyped] = useState(0)
  const [wrong, setWrong] = useState(false)
  const won = !watching && typed === 0 && shown > length

  // Show the first `shown` pads, one by one.
  useEffect(() => {
    if (!watching) return
    let k = 0
    const timers: number[] = []
    const step = () => {
      if (k >= Math.min(shown, length)) {
        timers.push(window.setTimeout(() => setWatching(false), 300))
        return
      }
      setLit(order[k])
      timers.push(window.setTimeout(() => setLit(null), 550))
      k++
      timers.push(window.setTimeout(step, 800))
    }
    timers.push(window.setTimeout(step, 700))
    return () => timers.forEach(clearTimeout)
  }, [watching, shown, order, length])

  const tap = (p: number) => {
    if (watching || won) return
    setLit(p)
    window.setTimeout(() => setLit(null), 200)
    if (p !== order[typed]) {
      setWrong(true)
      setTyped(0)
      setWatching(true)
      return
    }
    setWrong(false)
    if (typed + 1 < shown) setTyped(typed + 1)
    else {
      setTyped(0)
      if (shown >= length) setShown(length + 1)
      else {
        setShown(shown + 1)
        setWatching(true)
      }
    }
  }
  return (
    <div className="thinking">
      <p className="muted">{won ? '' : watching ? T.games.sequenceWatch : wrong ? T.games.sequenceWrong : T.games.sequenceYourTurn}</p>
      <div className={`pads p${pads}`}>
        {PADS.slice(0, pads).map((pad, p) => (
          <button key={p} className={`pad ${lit === p ? 'lit' : ''}`} style={{ '--pad': pad.colour } as React.CSSProperties} onClick={() => tap(p)} disabled={watching || won} aria-label={pad.emoji}>
            <Emoji name={pad.emoji} size={56} />
          </button>
        ))}
      </div>
      <LevelBar level={level} won={won} onNext={onNext} onEasier={onEasier}>
        <span className="pill">{T.games.sequenceProgress(Math.min(shown, length), length)}</span>
      </LevelBar>
    </div>
  )
}
