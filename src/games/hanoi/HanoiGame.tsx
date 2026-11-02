import { useState } from 'react'
import { useT } from '@/i18n'
import { LevelBar } from '../LevelBar'
import { useLevel } from '../levels'
import { canMove, fewestMoves, hanoiDiscs, isDone, move, startPegs } from './hanoi'

const COLOURS = ['#e2557e', '#e08a1e', '#f2c230', '#22a06b', '#178c84', '#5b6cf0', '#8b5cf6']

/** Tower of Hanoi: tap a peg to lift its top disc, then a peg to put it down. Plan ahead: the fewest moves win. */
export function HanoiGame() {
  const { level, up, down } = useLevel('hanoi')
  const [round, setRound] = useState(0)
  const next = (change: () => void) => {
    change()
    setRound((n) => n + 1)
  }
  return <Towers key={`${level}-${round}`} level={level} onNext={() => next(up)} onEasier={() => next(down)} />
}

function Towers({ level, onNext, onEasier }: { level: number; onNext: () => void; onEasier: () => void }) {
  const T = useT()
  const discs = hanoiDiscs(level)
  const [pegs, setPegs] = useState(() => startPegs(discs))
  const [held, setHeld] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const won = isDone(pegs, discs)
  const tap = (peg: number) => {
    if (won) return
    if (held === null) {
      if (pegs[peg].length) setHeld(peg)
      return
    }
    if (canMove(pegs, held, peg)) {
      setPegs(move(pegs, held, peg))
      setMoves((m) => m + 1)
    }
    setHeld(null)
  }
  return (
    <div className="thinking">
      <p className="muted">{won ? T.games.hanoiDone(moves, fewestMoves(discs)) : T.games.hanoiHelp}</p>
      <div className="hanoi">
        {pegs.map((peg, p) => (
          <button key={p} className={`hanoi-peg ${held === p ? 'held' : ''} ${held !== null && held !== p && canMove(pegs, held, p) ? 'can' : ''}`} onClick={() => tap(p)} aria-label={T.games.peg(p + 1)}>
            <span className="hanoi-pole" />
            {peg.map((d, k) => (
              <span key={d} className={`hanoi-disc ${held === p && k === peg.length - 1 ? 'up' : ''}`} style={{ width: `${30 + (70 * d) / discs}%`, background: COLOURS[d - 1] }} />
            ))}
          </button>
        ))}
      </div>
      <LevelBar level={level} won={won} onNext={onNext} onEasier={onEasier}>
        <span className="pill">
          {moves} {T.games.moves} · {T.games.fewest(fewestMoves(discs))}
        </span>
      </LevelBar>
    </div>
  )
}
