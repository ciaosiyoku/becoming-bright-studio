import { useEffect, useState } from 'react'
import { Memory } from '@/games/Memory'
import { Home } from '@/home/Home'
import { Lesson } from '@/lesson/Lesson'
import { Parent } from '@/parent/Parent'
import { PinGate } from '@/parent/PinScreens'
import { NeedPin, Setup } from '@/setup/Setup'
import { setVoiceGender } from '@/shared/speak'
import { activeChild } from './state'
import { useStore } from './store'
import { StoreProvider } from './StoreProvider'

// Three screens: Home (the child's skills and today's lesson), Lesson (one skill), Parent (behind the PIN).
// Before the first child exists: the setup. After starting again from a backup (no PIN in it): a new PIN first.

export type Screen = { name: 'home' } | { name: 'lesson'; skill: string } | { name: 'game'; skill: string } | { name: 'pin' } | { name: 'parent' }

export default function App() {
  return (
    <StoreProvider>
      <Screens />
    </StoreProvider>
  )
}

function Screens() {
  const { state, ready } = useStore()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const child = activeChild(state)

  // The reading voice the grown-ups chose.
  useEffect(() => setVoiceGender(state.family.voice), [state.family.voice])

  // The child's colour on buttons.
  useEffect(() => {
    if (child) document.documentElement.style.setProperty('--accent', child.colour)
  }, [child])

  if (!ready) return null
  if (!child) return <Setup />
  if (!state.family.pin) return <NeedPin />
  const home = () => setScreen({ name: 'home' })
  const game = (skill: string) => setScreen({ name: 'game', skill })
  if (screen.name === 'lesson') return <Lesson key={screen.skill} skill={screen.skill} onClose={home} onGame={game} />
  if (screen.name === 'game') return <Memory skill={screen.skill} onClose={home} />
  if (screen.name === 'parent') return <Parent onClose={home} />
  return (
    <>
      <Home onLesson={(skill) => setScreen({ name: 'lesson', skill })} onGame={game} onParent={() => setScreen({ name: 'pin' })} />
      {screen.name === 'pin' && <PinGate onOpen={() => setScreen({ name: 'parent' })} onClose={home} />}
    </>
  )
}
