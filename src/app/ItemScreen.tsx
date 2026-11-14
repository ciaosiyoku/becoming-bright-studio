import { ArrowLeft } from 'lucide-react'
import { lazy, type ReactNode } from 'react'
import { useT } from '@/i18n'
import { Loading } from '@/shared/Loading'
import { Emoji } from '@/shared/Emoji'
import { clock } from '@/shared/clock'
import { accessOf, earnedSecondsLeft } from './access'
import { type ItemId, ITEMS } from './items'
import { useToday } from '@/shared/useToday'
import { activeChild } from './state'
import { useStore } from './store'

// Each game, the radio, stories, videos and explore items load when they open (the first screen loads faster);
// shared/offline.ts saves them all on the device in the background, so they still open without Wi-Fi.
const MemoryGame = lazy(() => import('@/games/Memory').then((m) => ({ default: m.MemoryGame })))
const WordBuilder = lazy(() => import('@/games/builder/WordBuilder').then((m) => ({ default: m.WordBuilder })))
const CodeBreaker = lazy(() => import('@/games/codebreaker/CodeBreaker').then((m) => ({ default: m.CodeBreaker })))
const PuzzleGame = lazy(() => import('@/games/puzzle/PuzzleGame').then((m) => ({ default: m.PuzzleGame })))
const SlidingPuzzle = lazy(() => import('@/games/sliding/SlidingPuzzle').then((m) => ({ default: m.SlidingPuzzle })))
const HanoiGame = lazy(() => import('@/games/hanoi/HanoiGame').then((m) => ({ default: m.HanoiGame })))
const LogicGame = lazy(() => import('@/games/logic/LogicGame').then((m) => ({ default: m.LogicGame })))
const SequenceGame = lazy(() => import('@/games/sequence/SequenceGame').then((m) => ({ default: m.SequenceGame })))
const SudokuGame = lazy(() => import('@/games/sudoku/SudokuGame').then((m) => ({ default: m.SudokuGame })))
const Facts = lazy(() => import('@/explore/FactsScreen').then((m) => ({ default: m.Facts })))
const Places = lazy(() => import('@/explore/PlacesScreen').then((m) => ({ default: m.Places })))
const Whys = lazy(() => import('@/explore/WhysScreen').then((m) => ({ default: m.Whys })))
const Radio = lazy(() => import('@/media/Radio').then((m) => ({ default: m.Radio })))
const Fables = lazy(() => import('@/media/Fables').then((m) => ({ default: m.Fables })))
const Stories = lazy(() => import('@/media/Stories').then((m) => ({ default: m.Stories })))
const Videos = lazy(() => import('@/media/Videos').then((m) => ({ default: m.Videos })))

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
        <Loading
          failed={
            <section className="card todays">
              <p>{T.parent.updateOffline}</p>
              <button className="big" onClick={onClose}>
                {T.common.back}
              </button>
            </section>
          }
        >
          <Content id={id} />
        </Loading>
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
    case 'sudoku':
      return <SudokuGame />
    case 'hanoi':
      return <HanoiGame />
    case 'sequence':
      return <SequenceGame />
    case 'logic':
      return <LogicGame />
    case 'radio':
      return <Radio />
    case 'stories':
      return <Stories />
    case 'fables':
      return <Fables />
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
