import { useState } from 'react'
import { useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { LevelBar } from '../LevelBar'
import { useLevel } from '../levels'
import { fits, isSolvedSudoku, makeSudoku, sudokuLevel } from './sudoku'

const PICTURES = ['fruit-apple', 'fruit-banana', 'fruit-grapes', 'fruit-strawberry', 'fruit-pear', 'fruit-cherries']

/** Mini sudoku: tap an empty square, then a picture or number; each one once in every row, column and box. */
export function SudokuGame() {
  const { level, up, down } = useLevel('sudoku')
  const [round, setRound] = useState(0)
  const next = (change: () => void) => {
    change()
    setRound((n) => n + 1)
  }
  return <Board key={`${level}-${round}`} level={level} onNext={() => next(up)} onEasier={() => next(down)} />
}

function Board({ level, onNext, onEasier }: { level: number; onNext: () => void; onEasier: () => void }) {
  const T = useT()
  const shape = sudokuLevel(level)
  const size = shape.size
  const [{ puzzle, solution }] = useState(() => makeSudoku(size, shape.holes, Math.random))
  const [grid, setGrid] = useState(() => [...puzzle])
  const [picked, setPicked] = useState<number | null>(null)
  const won = isSolvedSudoku(grid, solution)
  const put = (v: number) => {
    if (picked === null || puzzle[picked] !== 0 || won) return
    setGrid((g) => g.map((x, i) => (i === picked ? (x === v ? 0 : v) : x)))
  }
  const symbol = (v: number) => (shape.pictures ? <Emoji name={PICTURES[v - 1]} size={size === 4 ? 44 : 34} /> : v)
  const cols = size === 4 ? 2 : 3
  return (
    <div className="thinking">
      <p className="muted">{won ? '' : T.games.sudokuHelp}</p>
      <div className={`sudoku s${size}`} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {grid.map((v, i) => {
          const row = Math.floor(i / size)
          const col = i % size
          const clash = v !== 0 && !fits(grid, size, i, v)
          return (
            <button
              key={i}
              className={`sudoku-cell ${puzzle[i] ? 'given' : ''} ${picked === i ? 'picked' : ''} ${clash ? 'clash' : ''} ${col % cols === cols - 1 && col < size - 1 ? 'edge-r' : ''} ${row % 2 === 1 && row < size - 1 ? 'edge-b' : ''}`}
              onClick={() => setPicked(i)}
              disabled={Boolean(puzzle[i]) || won}
              aria-label={v ? String(v) : T.games.empty}
            >
              {v ? symbol(v) : ''}
            </button>
          )
        })}
      </div>
      {!won && (
        <div className="row center">
          {Array.from({ length: size }, (_, k) => k + 1).map((v) => (
            <button key={v} className="secondary sudoku-pick" onClick={() => put(v)} disabled={picked === null || puzzle[picked] !== 0}>
              {symbol(v)}
            </button>
          ))}
        </div>
      )}
      <LevelBar level={level} won={won} onNext={onNext} onEasier={onEasier} />
    </div>
  )
}
