import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { isSolved, mixedBoard, slide } from './sliding'
import './Sliding.css'

/** Number slide: tap a number next to the gap to slide it, until the numbers are in order. 3 × 3 or 4 × 4. */
export function SlidingPuzzle() {
  const t = useT()
  const [n, setN] = useState(3)
  const [board, setBoard] = useState(() => mixedBoard(3))
  const [moves, setMoves] = useState(0)
  const done = isSolved(board)
  const start = (size: number) => {
    setN(size)
    setBoard(mixedBoard(size))
    setMoves(0)
  }
  const tap = (pos: number) => {
    if (done) return
    const next = slide(board, pos, n)
    if (next !== board) {
      setBoard(next)
      setMoves((m) => m + 1)
    }
  }
  return (
    <div className="sliding">
      <p className="muted">{done ? '' : t.games.slideHelp}</p>
      <div className="sliding-board" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {board.map((x, pos) => (
          <button key={pos} className={`sliding-tile ${x === 0 ? 'gap' : ''} ${done ? 'done' : ''}`} onClick={() => tap(pos)} disabled={x === 0} aria-label={x === 0 ? '' : String(x)}>
            {x === 0 ? '' : x}
          </button>
        ))}
      </div>
      <div className="row center">
        <span className="pill">
          {moves} {t.games.moves}
        </span>
        {done && (
          <b className="sliding-done">
            <Emoji name="party" size={32} /> {t.games.slideDone}
          </b>
        )}
      </div>
      <div className="row center">
        <span>{t.games.size}</span>
        {[3, 4].map((s) => (
          <button key={s} className={n === s ? '' : 'secondary'} onClick={() => start(s)}>
            {s} × {s}
          </button>
        ))}
        <button className="secondary" onClick={() => start(n)}>
          <RotateCcw /> {t.games.shuffle}
        </button>
      </div>
    </div>
  )
}
