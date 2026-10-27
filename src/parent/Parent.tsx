import { ArrowLeft } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { addChild, type Child, isoDate, newChild, removeChild } from '@/app/state'
import { useStore } from '@/app/store'
import { BackupError, backupDue, makeBackup, parseBackup, saveBackupFile } from '@/data/backup'
import { useLang, useT } from '@/i18n'
import { skillById, SKILLS, skillText } from '@/skills/index'
import { NO_LOCK } from './pin'
import { ChildForm } from '@/setup/Setup'
import { ChoosePin } from './PinScreens'
import './Parent.css'

/** The grown-ups' screen (behind the PIN): each child's misses today, children, the games switch, backup, the PIN. */
export function Parent({ onClose }: { onClose: () => void }) {
  const T = useT()
  const { state } = useStore()
  return (
    <main className="parent">
      <header className="parent-top">
        <button className="secondary" onClick={onClose}>
          <ArrowLeft /> {T.common.back}
        </button>
        <h1>{T.parent.title}</h1>
      </header>
      {state.children.map((c) => (
        <MissesCard key={c.id} child={c} />
      ))}
      <ChildrenCard />
      <GamesCard />
      <BackupCard />
      <PinCard />
    </main>
  )
}

/** The checks a child got wrong today, with the right answers, and how many skills they have learnt. */
function MissesCard({ child }: { child: Child }) {
  const T = useT()
  const lang = useLang()
  const [today] = useState(() => isoDate(new Date()))
  const misses = child.misses.filter((m) => m.day === today)
  const learnt = SKILLS.filter((s) => child.skills[s.id]?.mastered).length
  return (
    <section className="card parent-card">
      <h2>
        {T.parent.misses}
        {child.name ? ` · ${child.name}` : ''}
      </h2>
      <p className="muted">{T.parent.missesNote}</p>
      {misses.length === 0 ? (
        <p>{T.parent.missesNone}</p>
      ) : (
        <table className="misses">
          <thead>
            <tr>
              <th>{T.parent.question}</th>
              <th>{T.parent.answered}</th>
              <th>{T.parent.rightAnswer}</th>
            </tr>
          </thead>
          <tbody>
            {misses.map((m, i) => {
              const def = skillById(m.skill)
              return (
                <tr key={i}>
                  <td>
                    {m.prompt}
                    {def && <small className="muted"> · {skillText(def, lang).title}</small>}
                  </td>
                  <td className="given">{m.given}</td>
                  <td className="answer">{m.answer}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      <p className="pill">{T.parent.learnt(learnt, SKILLS.length)}</p>
    </section>
  )
}

/** The children: each has a name, a colour and their own progress. One PIN for the family. */
function ChildrenCard() {
  const T = useT()
  const { state, update } = useStore()
  const [adding, setAdding] = useState(false)
  return (
    <section className="card parent-card">
      <h2>{T.parent.children}</h2>
      <p className="muted">{T.parent.childrenNote}</p>
      <ul className="child-list">
        {state.children.map((c) => (
          <li key={c.id}>
            <i className="dot" style={{ background: c.colour }} />
            <b>{c.name || '?'}</b>
            <span className="muted">{T.parent.learnt(SKILLS.filter((s) => c.skills[s.id]?.mastered).length, SKILLS.length)}</span>
            {state.children.length > 1 && (
              <button className="secondary" onClick={() => confirm(T.parent.confirmRemove(c.name)) && update((s) => removeChild(s, c.id))}>
                {T.parent.remove}
              </button>
            )}
          </li>
        ))}
      </ul>
      {adding ? (
        <ChildForm
          submit={T.parent.add}
          onDone={({ name, colour }) => {
            update((s) => addChild(s, newChild(name, colour)))
            setAdding(false)
          }}
        />
      ) : (
        <div className="row">
          <button className="secondary" onClick={() => setAdding(true)}>
            {T.parent.addChild}
          </button>
        </div>
      )}
    </section>
  )
}

/** "Games allowed": a learnt skill unlocks a short memory game made of its pictures. */
function GamesCard() {
  const T = useT()
  const { state, update } = useStore()
  const on = state.family.gamesAllowed
  return (
    <section className="card parent-card">
      <h2>{T.parent.games}</h2>
      <p className="muted">{T.parent.gamesNote}</p>
      <div className="row">
        {([true, false] as const).map((value) => (
          <button key={String(value)} className={on === value ? '' : 'secondary'} aria-pressed={on === value} onClick={() => update((s) => ({ ...s, family: { ...s.family, gamesAllowed: value } }))}>
            {value ? T.common.on : T.common.off}
          </button>
        ))}
      </div>
    </section>
  )
}

function BackupCard() {
  const T = useT()
  const { state, update, replace } = useStore()
  const [message, setMessage] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const [now] = useState(Date.now)
  const save = async () => {
    await saveBackupFile(makeBackup(state))
    update((s) => ({ ...s, lastBackupAt: Date.now() }))
    setMessage(T.parent.saved)
  }
  const restore = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const restored = parseBackup(await f.text())
      if (!confirm(T.parent.confirmRestore)) return
      // A backup holds no PIN: this device keeps the one it has.
      const { pin, recovery } = state.family
      replace({ ...restored, family: { ...restored.family, pin, recovery, pinLock: NO_LOCK } })
      setMessage(T.parent.restored)
    } catch (err) {
      setMessage(err instanceof BackupError ? T.parent.errors[err.reason] : String(err))
    }
  }
  return (
    <section className={`card parent-card ${backupDue(state, now) ? 'due' : ''}`}>
      <h2>{T.parent.backup}</h2>
      <p className="muted">{T.parent.backupNote}</p>
      <p>{state.lastBackupAt ? T.parent.lastBackup(new Date(state.lastBackupAt).toLocaleDateString()) : T.parent.never}</p>
      <div className="row">
        <button onClick={() => void save()}>{T.parent.backupNow}</button>
        <button className="secondary" onClick={() => file.current?.click()}>
          {T.parent.restore}
        </button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => void restore(e)} />
      </div>
      {message && <p className="pill">{message}</p>}
    </section>
  )
}

/** Changing the PIN (with a new recovery code, shown once). */
function PinCard() {
  const T = useT()
  const { update } = useStore()
  const [changing, setChanging] = useState(false)
  const [done, setDone] = useState(false)
  return (
    <section className="card parent-card">
      <h2>{T.parent.security}</h2>
      <div className="row">
        <button className="secondary" onClick={() => setChanging(true)}>
          {T.parent.changePin}
        </button>
      </div>
      {done && <p className="pill">{T.parent.pinChanged}</p>}
      {changing && (
        <ChoosePin
          onClose={() => setChanging(false)}
          onDone={(pin, recovery) => {
            update((s) => ({ ...s, family: { ...s.family, pin, recovery, pinLock: NO_LOCK } }))
            setChanging(false)
            setDone(true)
          }}
        />
      )}
    </section>
  )
}
