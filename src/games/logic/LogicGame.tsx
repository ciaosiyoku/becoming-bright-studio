import { useState } from 'react'
import { useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { LevelBar } from '../LevelBar'
import { useLevel } from '../levels'
import { type Cell, makeLogic } from './logic'

/** Puzzles in a round; 4 right of 5 goes up a level. */
const ROUND = 5
const TO_PASS = 4

/** Picture logic: find the rule of the grid and pick the missing square. Five puzzles a round. */
export function LogicGame() {
  const { level, up, down } = useLevel('logic')
  const [round, setRound] = useState(0)
  const next = (change: () => void) => {
    change()
    setRound((n) => n + 1)
  }
  return <Round key={`${level}-${round}`} level={level} onNext={() => next(up)} onAgain={() => setRound((n) => n + 1)} onEasier={() => next(down)} />
}

function CellView({ cell, size }: { cell: Cell; size: number }) {
  return (
    <span className="logic-cell-pics">
      {Array.from({ length: cell.count }, (_, k) => (
        <Emoji key={k} name={cell.emoji} size={size} />
      ))}
    </span>
  )
}

function Round({ level, onNext, onAgain, onEasier }: { level: number; onNext: () => void; onAgain: () => void; onEasier: () => void }) {
  const T = useT()
  const [puzzles] = useState(() => Array.from({ length: ROUND }, () => makeLogic(level, Math.random)))
  const [at, setAt] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [right, setRight] = useState(0)
  const finished = at >= ROUND
  const passed = finished && right >= TO_PASS
  const p = puzzles[Math.min(at, ROUND - 1)]
  const pick = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === p.answer) setRight((n) => n + 1)
  }
  const pic = p.size === 2 ? 34 : 26
  return (
    <div className="thinking">
      {finished ? (
        <p>{T.games.logicScore(right, ROUND)}</p>
      ) : (
        <>
          <p className="muted">{T.games.logicHelp}</p>
          <div className="logic-grid" style={{ gridTemplateColumns: `repeat(${p.size}, minmax(0, 1fr))` }}>
            {p.cells.map((c, i) => (
              <div key={i} className={`logic-cell ${i === p.missing ? 'missing' : ''}`}>
                {i === p.missing ? (picked === null ? '?' : <CellView cell={p.choices[p.answer]} size={pic} />) : <CellView cell={c} size={pic} />}
              </div>
            ))}
          </div>
          <div className="logic-choices">
            {p.choices.map((c, i) => (
              <button key={i} className={`logic-choice ${picked === null ? '' : i === p.answer ? 'right' : i === picked ? 'wrong' : 'faded'}`} onClick={() => pick(i)}>
                <CellView cell={c} size={pic} />
              </button>
            ))}
          </div>
          {picked !== null && (
            <div className="row center">
              <span>{picked === p.answer ? T.lesson.yes : T.games.logicWrong}</span>
              <button
                className="big"
                onClick={() => {
                  setAt(at + 1)
                  setPicked(null)
                }}
              >
                {T.lesson.next}
              </button>
            </div>
          )}
        </>
      )}
      <LevelBar level={level} won={passed} onNext={onNext} onEasier={onEasier}>
        <span className="pill">{T.games.logicProgress(Math.min(at + 1, ROUND), ROUND)}</span>
        {finished && !passed && (
          <button className="big" onClick={onAgain}>
            {T.games.playAgain}
          </button>
        )}
      </LevelBar>
    </div>
  )
}
