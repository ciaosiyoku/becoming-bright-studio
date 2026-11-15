import { useState } from 'react'
import { addChild, COLOURS, newChild } from '@/app/state'
import { AGE_BANDS, bandLabel, bandOf, firstAge } from '@/skills/ages'
import { useStore } from '@/app/store'
import { useT } from '@/i18n'
import type { PinHash } from '@/parent/pin'
import { ChoosePin, RecoveryDetails } from '@/parent/PinScreens'
import { LanguagePicker } from '@/shared/LanguagePicker'
import './Setup.css'

/** First start: the child's name and colour, then the family PIN (with its recovery code, shown once). */
export function Setup() {
  const T = useT()
  const { update } = useStore()
  const [child, setChild] = useState<ChildInfo | null>(null)
  const [pins, setPins] = useState<{ pin: PinHash; recovery: PinHash } | null>(null)
  if (!child)
    return (
      <main className="setup">
        <section className="card setup-card">
          <LanguagePicker />
          <img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" width={112} height={112} />
          <h1>{T.appName}</h1>
          <p className="tagline">{T.tagline}</p>
          <p>{T.setup.welcome}</p>
          <ChildForm submit={T.setup.next} onDone={setChild} />
        </section>
      </main>
    )
  if (!pins)
    return (
      <main className="setup">
        <ChoosePin title={T.setup.pinTitle} note={T.setup.pinText} onClose={() => setChild(null)} onDone={(pin, recovery) => setPins({ pin, recovery })} />
      </main>
    )
  return (
    <main className="setup">
      <RecoveryDetails
        onDone={(recoveryEmail, secretWord) => {
          const c = newChild(child.name, child.colour, undefined, child.age)
          update((s) => addChild({ ...s, family: { ...s.family, ...pins, recoveryEmail, secretWord } }, c))
        }}
      />
    </main>
  )
}

/** After starting again from a backup (which holds no PIN): choose a new PIN before anything else. */
export function NeedPin() {
  const { update } = useStore()
  const [pins, setPins] = useState<{ pin: PinHash; recovery: PinHash } | null>(null)
  return (
    <main className="setup">
      {pins ? (
        <RecoveryDetails onDone={(recoveryEmail, secretWord) => update((s) => ({ ...s, family: { ...s.family, ...pins, recoveryEmail, secretWord } }))} />
      ) : (
        <ChoosePin onDone={(pin, recovery) => setPins({ pin, recovery })} />
      )}
    </main>
  )
}

export interface ChildInfo {
  name: string
  colour: string
  age: number | null
}

/** A child's first name, age and colour (setup, and adding a child on the grown-ups' screen). */
export function ChildForm({ submit, onDone }: { submit: string; onDone: (child: ChildInfo) => void }) {
  const T = useT()
  const [name, setName] = useState('')
  const [age, setAge] = useState<number | null>(null)
  const [colour, setColour] = useState<string>(COLOURS[0])
  return (
    <div className="child-form">
      <h2>{T.setup.childTitle}</h2>
      <label className="field">
        <span>{T.setup.nameLabel}</span>
        <input value={name} maxLength={24} placeholder={T.setup.namePlaceholder} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="field">
        <span>{T.setup.age}</span>
        <AgePicker age={age} onAge={setAge} />
      </div>
      <div className="field">
        <span>{T.setup.colour}</span>
        <div className="colours">
          {COLOURS.map((c) => (
            <button key={c} className={`colour ${c === colour ? 'on' : ''}`} style={{ background: c }} onClick={() => setColour(c)} aria-label={c} aria-pressed={c === colour} />
          ))}
        </div>
      </div>
      <button className="big" disabled={age === null} onClick={() => onDone({ name, colour, age })}>
        {submit}
      </button>
    </div>
  )
}

/** The child's age range (4–5, 6–7, 8–9 or 10–12): it decides which skills and stories they see. Ages in one range
 * see the same skills, so they are one choice; the range's youngest age is saved. */
export function AgePicker({ age, onAge }: { age: number | null; onAge: (age: number) => void }) {
  const chosen = age == null ? null : bandOf(age)
  return (
    <div className="ages" role="radiogroup">
      {AGE_BANDS.map((band) => (
        <button key={band} role="radio" aria-checked={band === chosen} className={band === chosen ? '' : 'secondary'} onClick={() => onAge(firstAge(band))}>
          {bandLabel(band)}
        </button>
      ))}
    </div>
  )
}
