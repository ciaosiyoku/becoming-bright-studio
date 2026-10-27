import { useState } from 'react'
import { addChild, COLOURS, newChild } from '@/app/state'
import { useStore } from '@/app/store'
import { useT } from '@/i18n'
import { ChoosePin } from '@/parent/PinScreens'
import './Setup.css'

/** First start: the child's name and colour, then the family PIN (with its recovery code, shown once). */
export function Setup() {
  const T = useT()
  const { update } = useStore()
  const [child, setChild] = useState<{ name: string; colour: string } | null>(null)
  if (!child)
    return (
      <main className="setup">
        <section className="card setup-card">
          <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" width={112} height={112} />
          <h1>{T.appName}</h1>
          <p className="tagline">{T.tagline}</p>
          <p>{T.setup.welcome}</p>
          <ChildForm submit={T.setup.next} onDone={setChild} />
        </section>
      </main>
    )
  return (
    <main className="setup">
      <ChoosePin
        title={T.setup.pinTitle}
        note={T.setup.pinText}
        onClose={() => setChild(null)}
        onDone={(pin, recovery) => {
          const c = newChild(child.name, child.colour)
          update((s) => addChild({ ...s, family: { ...s.family, pin, recovery } }, c))
        }}
      />
    </main>
  )
}

/** After starting again from a backup (which holds no PIN): choose a new PIN before anything else. */
export function NeedPin() {
  const { update } = useStore()
  return (
    <main className="setup">
      <ChoosePin onDone={(pin, recovery) => update((s) => ({ ...s, family: { ...s.family, pin, recovery } }))} />
    </main>
  )
}

/** A child's first name and colour (setup, and adding a child on the grown-ups' screen). */
export function ChildForm({ submit, onDone }: { submit: string; onDone: (child: { name: string; colour: string }) => void }) {
  const T = useT()
  const [name, setName] = useState('')
  const [colour, setColour] = useState<string>(COLOURS[0])
  return (
    <div className="child-form">
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
      <button className="big" onClick={() => onDone({ name, colour })}>
        {submit}
      </button>
    </div>
  )
}
