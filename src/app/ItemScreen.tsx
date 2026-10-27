import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { WordBuilder } from '@/games/builder/WordBuilder'
import { CodeBreaker } from '@/games/codebreaker/CodeBreaker'
import { MemoryGame } from '@/games/Memory'
import { PuzzleGame } from '@/games/puzzle/PuzzleGame'
import { SlidingPuzzle } from '@/games/sliding/SlidingPuzzle'
import { Facts } from '@/explore/FactsScreen'
import { Places } from '@/explore/PlacesScreen'
import { Whys } from '@/explore/WhysScreen'
import { useT } from '@/i18n'
import { Radio } from '@/media/Radio'
import { Stories } from '@/media/Stories'
import { Videos } from '@/media/Videos'
import { Emoji } from '@/shared/Emoji'
import { clock } from '@/shared/clock'
import { accessOf, earnedSecondsLeft } from './access'
import { type ItemId, ITEMS } from './items'
import { useToday } from '@/shared/useToday'
import { activeChild } from './state'
import { useStore } from './store'

/** One item full screen, with a back button; an "earn first" item shows the earned time left and closes when it runs out. */
export function ItemScreen({ id, onClose }: { id: ItemId; onClose: () => void }) {
  const T = useT()
  const today = useToday()
  const { state } = useStore()
  const child = activeChild(state)!
  const earning = accessOf(state.family, id, ITEMS[id].access) === 'earn'
  const left = earnedSecondsLeft(child, state.family, today)
  return (
    <main className="item-screen">
      <header className="lesson-top">
        <button className="secondary" onClick={onClose} aria-label={T.common.back}>
          <ArrowLeft />
        </button>
        <h1>
          <Emoji name={ITEMS[id].emoji} size={40} /> {T.items[id]}
        </h1>
        {earning && <span className="pill">{clock(left)}</span>}
      </header>
      {earning && left <= 0 ? (
        <section className="card todays">
          <Emoji name="clock" size={100} />
          <p>{T.access.timeUp}</p>
          <button className="big" onClick={onClose}>
            {T.common.back}
          </button>
        </section>
      ) : (
        <Content id={id} />
      )}
    </main>
  )
}

function Content({ id }: { id: ItemId }): ReactNode {
  switch (id) {
    case 'memory':
      return <MemoryGame />
    case 'builder':
      return <WordBuilder />
    case 'codebreaker':
      return <CodeBreaker />
    case 'puzzle':
      return <PuzzleGame />
    case 'sliding':
      return <SlidingPuzzle />
    case 'radio':
      return <Radio />
    case 'stories':
      return <Stories />
    case 'videos':
      return <Videos />
    case 'places':
      return <Places />
    case 'whys':
      return <Whys />
    case 'facts':
      return <Facts />
  }
}
