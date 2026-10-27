import { useState } from 'react'
import { COLOURS, newChild } from '@/app/state'
import { useStore } from '@/app/store'
import { useT } from '@/i18n'
import './Setup.css'

/** First start: the child's name and colour. */
export function Setup() {
  const T = useT()
  const { update } = useStore()
  const [name, setName] = useState('')
  const [colour, setColour] = useState<string>(COLOURS[0])
  const start = () => {
    const child = newChild(name, colour)
    update((s) => ({ ...s, children: [...s.children, child], activeChild: child.id }))
  }
  return (
    <main className="setup">
      <section className="card setup-card">
        <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" width={112} height={112} />
        <h1>{T.appName}</h1>
        <p className="tagline">{T.tagline}</p>
        <p>{T.setup.welcome}</p>
        <h2>{T.setup.childTitle}</h2>
        <label className="field">
          <span>{T.setup.nameLabel}</span>
          <input value={name} maxLength={24} placeholder={T.setup.namePlaceholder} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field">
          <span>{T.setup.colour}</span>
          <div className="colours">
            {COLOURS.map((c) => (
              <button key={c} className={`colour ${c === colour ? 'on' : ''}`} style={{ background: c }} onClick={() => setColour(c)} aria-label={c} aria-pressed={c === colour} />
            ))}
          </div>
        </div>
        <button className="big" onClick={start}>
          {T.setup.start}
        </button>
      </section>
    </main>
  )
}
