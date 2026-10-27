import { useEffect, useRef, useState } from 'react'
import { Home } from '@/home/Home'
import { Lesson } from '@/lesson/Lesson'
import { Parent } from '@/parent/Parent'
import { PinGate } from '@/parent/PinScreens'
import { NeedPin, Setup } from '@/setup/Setup'
import { setVoiceGender } from '@/shared/speak'
import { ItemScreen } from './ItemScreen'
import { ItemsPage } from './ItemsPage'
import { accessOf, earnedSecondsLeft } from './access'
import { type ItemId, ITEMS } from './items'
import { Shell, type MainTab } from './Shell'
import { activeChild, type Area, isoDate, updateChild } from './state'
import { useStore } from './store'
import { StoreProvider } from './StoreProvider'

// The child's app: four tabs (Learn, Games, Listen and watch, Explore) in a frame, a lesson or an item full screen,
// and the grown-ups' screen behind the PIN. Before the first child exists: the setup. After starting again from a
// backup (no PIN in it): a new PIN first.

export type Screen = { name: 'tabs' } | { name: 'lesson'; skill: string } | { name: 'item'; id: ItemId } | { name: 'pin' } | { name: 'parent' }

export default function App() {
  return (
    <StoreProvider>
      <Screens />
    </StoreProvider>
  )
}

const TICK_SECONDS = 15

function Screens() {
  const { state, ready } = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'tabs' })
  const [tab, setTab] = useState<MainTab>('learn')
  const child = activeChild(state)

  // The reading voice the grown-ups chose.
  useEffect(() => setVoiceGender(state.family.voice), [state.family.voice])

  // The child's colour on buttons.
  useEffect(() => {
    if (child) document.documentElement.style.setProperty('--accent', child.colour)
  }, [child])

  useUsageClock(screen)

  if (!ready) return null
  if (!child) return <Setup />
  if (!state.family.pin) return <NeedPin />
  const tabs = () => setScreen({ name: 'tabs' })
  if (screen.name === 'lesson') return <Lesson key={screen.skill} skill={screen.skill} onClose={tabs} />
  if (screen.name === 'item') return <ItemScreen id={screen.id} onClose={tabs} />
  if (screen.name === 'parent') return <Parent onClose={tabs} />
  return (
    <>
      <Shell tab={tab} onTab={setTab} onParent={() => setScreen({ name: 'pin' })}>
        {tab === 'learn' ? <Home onLesson={(skill) => setScreen({ name: 'lesson', skill })} onParent={() => setScreen({ name: 'pin' })} /> : <ItemsPage tab={tab} onOpen={(id) => setScreen({ name: 'item', id })} />}
      </Shell>
      {screen.name === 'pin' && <PinGate onOpen={() => setScreen({ name: 'parent' })} onClose={tabs} />}
    </>
  )
}

/**
 * Every 15 seconds while the app is visible: 15 seconds go to the area open (lessons, games, media, explore) for the
 * reports, and an "earn first" item open with earned time uses that much of it. The grown-ups' screen is not counted.
 */
function useUsageClock(screen: Screen) {
  const { update } = useStore()
  const live = useRef(screen)
  useEffect(() => {
    live.current = screen
  }, [screen])
  useEffect(() => {
    const timer = setInterval(() => {
      const s = live.current
      if (document.hidden || (s.name !== 'lesson' && s.name !== 'item')) return
      const day = isoDate(new Date())
      update((st) => {
        const child = activeChild(st)
        if (!child) return st
        const area: Area = s.name === 'lesson' ? 'lessons' : ITEMS[s.id].tab
        const earning = s.name === 'item' && accessOf(st.family, s.id, ITEMS[s.id].access) === 'earn' && earnedSecondsLeft(child, st.family, day) > 0
        return updateChild(st, child.id, (c) => ({
          ...c,
          usage: { ...c.usage, [day]: { ...c.usage[day], [area]: (c.usage[day]?.[area] ?? 0) + TICK_SECONDS } },
          earnedUsed: earning ? { ...c.earnedUsed, [day]: (c.earnedUsed[day] ?? 0) + TICK_SECONDS } : c.earnedUsed,
        }))
      })
    }, TICK_SECONDS * 1000)
    return () => clearInterval(timer)
  }, [update])
}
