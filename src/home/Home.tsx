import { Settings } from 'lucide-react'
import { useState } from 'react'
import { activeChild } from '@/app/state'
import { useStore } from '@/app/store'
import { backupDue } from '@/data/backup'
import { Emoji } from '@/shared/Emoji'
import { useT } from '@/i18n'
import './Home.css'

/** The child's home: hello, today's lesson, and (once a week) a backup reminder for the grown-ups. */
export function Home({ onLesson, onParent }: { onLesson: (skill: string) => void; onParent: () => void }) {
  const T = useT()
  const { state } = useStore()
  const child = activeChild(state)!
  const [now] = useState(Date.now)
  return (
    <main className="home">
      <header className="home-top">
        <h1>{T.home.hello(child.name)}</h1>
        <button className="secondary" onClick={onParent}>
          <Settings /> {T.home.parents}
        </button>
      </header>
      {backupDue(state, now) && (
        <button className="backup-reminder secondary" onClick={onParent}>
          <Emoji name="memo" size={32} /> {T.home.backupDue}
        </button>
      )}
      <section className="card todays">
        <h2>{T.home.todays}</h2>
        <button className="big" onClick={() => onLesson('first')}>
          {T.home.start}
        </button>
      </section>
    </main>
  )
}
