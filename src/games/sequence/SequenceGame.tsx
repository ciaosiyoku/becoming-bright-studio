import { Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { playNote, playSound } from '@/shared/sounds'
import { speak, stopSpeaking } from '@/shared/speak'
import { LevelBar } from '../LevelBar'
import { useLevel } from '../levels'
import { sequenceLevel } from './sequence'

// Repeat the pattern: after Start, the pads light up and play their notes one after another; the child taps them in the
// same order, each tap with its note (a soft "hmm" for a wrong one, a chime for a round done). "Watch again" shows the
// round's pattern again. Each round adds one more; reaching the level's length wins. Trains working memory and
// attention.

// Each pad has its own picture, colour and note (C, D, E, G, A, high C), so the pattern can be heard as well as seen.
const PADS = [
  { emoji: 'star', colour: '#f2c230', hz: 523 },
  { emoji: 'heart', colour: '#e2557e', hz: 587 },
  { emoji: 'droplet', colour: '#5b6cf0', hz: 659 },
  { emoji: 'seedling', colour: '#22a06b', hz: 784 },
  { emoji: 'moon', colour: '#8b5cf6', hz: 880 },
  { emoji: 'fire', colour: '#e08a1e', hz: 1047 },
]

export function SequenceGame() {
  const { level, up, down } = useLevel('sequence')
  const [round, setRound] = useState(0)
  const next = (change: () => void) => {
    change()
    setRound((n) => n + 1)
  }
  return <Pads key={`${level}-${round}`} level={level} first={round === 0} onNext={() => next(up)} onEasier={() => next(down)} />
}

function Pads({ level, first, onNext, onEasier }: { level: number; first: boolean; onNext: () => void; onEasier: () => void }) {
  const T = useT()
  const lang = useLang()
  const { pads, length } = sequenceLevel(level)
  const [order] = useState(() => Array.from({ length }, () => Math.floor(Math.random() * pads)))
  // Nothing plays until the child taps Start (a tap also lets the device play sound).
  const [started, setStarted] = useState(false)
  const [shown, setShown] = useState(2) // how many of the order this round asks for
  const [lit, setLit] = useState<number | null>(null)
  const [watching, setWatching] = useState(false)
  const [typed, setTyped] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [shake, setShake] = useState(0)
  const won = started && !watching && typed === 0 && shown > length

  // Show the first `shown` pads, one by one, each with its note.
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
      playNote(PADS[order[k]].hz, 0.45)
      timers.push(window.setTimeout(() => setLit(null), 550))
      k++
      timers.push(window.setTimeout(step, 800))
    }
    timers.push(window.setTimeout(step, 700))
    return () => timers.forEach(clearTimeout)
  }, [watching, shown, order, length])

  // The voice reads what to do when the game opens (not again at each new level), and stops at Start so the notes
  // are heard on their own.
  useEffect(() => {
    if (first) speak(T.games.sequenceIntro, lang)
    return () => stopSpeaking()
  }, [first, T, lang])

  const start = () => {
    stopSpeaking()
    setStarted(true)
    setWatching(true)
  }
  /** Show this round's pattern again (as often as the child likes): their taps start again. */
  const watchAgain = () => {
    setTyped(0)
    setWrong(false)
    setWatching(true)
  }

  const tap = (p: number) => {
    if (!started || watching || won) return
    setLit(p)
    window.setTimeout(() => setLit(null), 250)
    if (p !== order[typed]) {
      playSound('miss')
      setShake((n) => n + 1)
      setWrong(true)
      setTyped(0)
      setWatching(true)
      return
    }
    playNote(PADS[p].hz, 0.3)
    setWrong(false)
    if (typed + 1 < shown) setTyped(typed + 1)
    else {
      setTyped(0)
      if (shown >= length) {
        setShown(length + 1)
        playSound('done')
      } else {
        window.setTimeout(() => playSound('right'), 250)
        setShown(shown + 1)
        setWatching(true)
      }
    }
  }
  const round = Math.min(shown, length)
  return (
    <div className="thinking">
      <p className="muted">{!started ? T.games.sequenceIntro : won ? '' : watching ? T.games.sequenceWatch : wrong ? T.games.sequenceWrong : T.games.sequenceYourTurn}</p>
      <div key={shake} className={`pads p${pads} ${shake ? 'shake' : ''} ${!started || watching ? 'waiting' : 'ready'}`}>
        {PADS.slice(0, pads).map((pad, p) => (
          <button key={p} className={`pad ${lit === p ? 'lit' : ''}`} style={{ '--pad': pad.colour } as React.CSSProperties} onClick={() => tap(p)} disabled={!started || watching || won} aria-label={pad.emoji}>
            <Emoji name={pad.emoji} size={56} />
          </button>
        ))}
      </div>
      {/* Taps so far this round: one dot per pad of the pattern. */}
      {started && !won && (
        <div className="seq-dots" aria-hidden="true">
          {Array.from({ length: round }, (_, i) => (
            <span key={i} className={i < typed ? 'done' : ''} />
          ))}
        </div>
      )}
      <div className="row center">
        {!started && (
          <button className="big" onClick={start}>
            <Play /> {T.games.sequenceStart}
          </button>
        )}
        {started && !won && (
          <button className="secondary" onClick={watchAgain} disabled={watching}>
            <RotateCcw /> {T.games.sequenceReplay}
          </button>
        )}
      </div>
      <LevelBar level={level} won={won} onNext={onNext} onEasier={onEasier}>
        <span className="pill">{T.games.sequenceProgress(round, length)}</span>
      </LevelBar>
    </div>
  )
}
