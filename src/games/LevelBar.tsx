import { ArrowRight, Minus } from 'lucide-react'
import { useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { MAX_LEVEL } from './levels'
import './Thinking.css'

/** The level of a thinking game, a way to make it easier, and after a win: well done and the next level. */
export function LevelBar({ level, won, onNext, onEasier, children }: { level: number; won: boolean; onNext: () => void; onEasier: () => void; children?: React.ReactNode }) {
  const T = useT()
  return (
    <div className="level-bar">
      <span className="pill">{T.games.level(level)}</span>
      {children}
      {won ? (
        <>
          <b className="thinking-done">
            <Emoji name="party" size={32} /> {T.games.wellDone}
          </b>
          <button className="big" onClick={onNext}>
            {level < MAX_LEVEL ? T.games.nextLevel : T.games.playAgain} <ArrowRight />
          </button>
        </>
      ) : (
        level > 1 && (
          <button className="secondary" onClick={onEasier}>
            <Minus /> {T.games.easier}
          </button>
        )
      )}
    </div>
  )
}
