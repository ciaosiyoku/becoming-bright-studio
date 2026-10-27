import { useEffect, useState } from 'react'
import { Home } from '@/home/Home'
import { Lesson } from '@/lesson/Lesson'
import { Parent } from '@/parent/Parent'
import { Setup } from '@/setup/Setup'
import { activeChild } from './state'
import { useStore } from './store'
import { StoreProvider } from './StoreProvider'

// Three screens: Home (the child's skills and today's lesson), Lesson (one skill), Parent. Before the first child
// exists: the setup.

export type Screen = { name: 'home' } | { name: 'lesson'; skill: string } | { name: 'parent' }

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

  // The child's colour on buttons.
  useEffect(() => {
    if (child) document.documentElement.style.setProperty('--accent', child.colour)
  }, [child])

  if (!ready) return null
  if (!child) return <Setup />
  const home = () => setScreen({ name: 'home' })
  if (screen.name === 'lesson') return <Lesson key={screen.skill} skill={screen.skill} onClose={home} />
  if (screen.name === 'parent') return <Parent onClose={home} />
  return <Home onLesson={(skill) => setScreen({ name: 'lesson', skill })} onParent={() => setScreen({ name: 'parent' })} />
}
