import { ArrowLeft } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { addChild, newChild, removeChild } from '@/app/state'
import { useStore } from '@/app/store'
import { BackupError, backupDue, makeBackup, parseBackup, saveBackupFile } from '@/data/backup'
import { useLang, useT } from '@/i18n'
import { SKILLS } from '@/skills/index'
import { accessOf } from '@/app/access'
import { type Access, type ItemId, ITEM_IDS, ITEMS } from '@/app/items'
import { Emoji } from '@/shared/Emoji'
import { runningVersion, updateNow } from '@/shared/autoUpdate'
import { NO_LOCK } from './pin'
import { LanguagePicker } from '@/shared/LanguagePicker'
import { speak, useVoiceChoice, type VoiceGender } from '@/shared/speak'
import { ChildForm } from '@/setup/Setup'
import { ChoosePin } from './PinScreens'
import { ReportCard } from './ReportCard'
import './Parent.css'

/** The grown-ups' screen (behind the PIN): each child's learning report, children, the games switch, backup, the PIN. */
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
        <ReportCard key={c.id} child={c} />
      ))}
      <ChildrenCard />
      <AccessCard />
      <section className="card parent-card">
        <h2>{T.language.label}</h2>
        <p className="muted">{T.language.note}</p>
        <LanguagePicker />
      </section>
      <VoiceCard />
      <BackupCard />
      <PinCard />
      <UpdateCard />
    </main>
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

/** What the child can open: each item off, open or "earn first", and how much time a passed lesson earns. */
function AccessCard() {
  const T = useT()
  const { state, update } = useStore()
  const set = (id: ItemId, value: Access) => update((s) => ({ ...s, family: { ...s.family, access: { ...s.family.access, [id]: value } } }))
  const reward = (change: Partial<typeof state.family.rewards>) => update((s) => ({ ...s, family: { ...s.family, rewards: { ...s.family.rewards, ...change } } }))
  const r = state.family.rewards
  return (
    <section className="card parent-card">
      <h2>{T.parent.accessTitle}</h2>
      <p className="muted">{T.parent.accessNote}</p>
      <table className="access">
        <tbody>
          {ITEM_IDS.map((id) => (
            <tr key={id}>
              <td>
                <Emoji name={ITEMS[id].emoji} size={28} /> {T.items[id]}
              </td>
              <td>
                <div className="segmented">
                  {(['off', 'open', 'earn'] as const).map((value) => (
                    <button key={value} className={accessOf(state.family, id, ITEMS[id].access) === value ? '' : 'secondary'} aria-pressed={accessOf(state.family, id, ITEMS[id].access) === value} onClick={() => set(id, value)}>
                      {T.access[value]}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stepper label={T.parent.minutesPerLesson} value={r.minutesPerLesson} min={5} max={30} step={5} onChange={(n) => reward({ minutesPerLesson: n })} />
      <Stepper label={T.parent.maxPerDay} value={r.maxPerDay} min={10} max={180} step={5} onChange={(n) => reward({ maxPerDay: n })} />
    </section>
  )
}

function Stepper({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div className="stepper-row">
      <span>{label}</span>
      <div className="row">
        <button className="secondary round" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={`${label} −`}>
          −
        </button>
        <strong>{value} min</strong>
        <button className="secondary round" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={`${label} +`}>
          +
        </button>
      </div>
    </div>
  )
}

/** Reading aloud with a female or a male voice, and a test. Says when the device has no voice of that kind. */
function VoiceCard() {
  const T = useT()
  const lang = useLang()
  const { state, update } = useStore()
  const want = state.family.voice
  const choice = useVoiceChoice(lang, want)
  const set = (voice: VoiceGender) => update((s) => ({ ...s, family: { ...s.family, voice } }))
  return (
    <section className="card parent-card">
      <h2>{T.parent.voice}</h2>
      <p className="muted">{T.parent.voiceNote}</p>
      <div className="row">
        {(['female', 'male'] as const).map((g) => (
          <button key={g} className={want === g ? '' : 'secondary'} aria-pressed={want === g} onClick={() => set(g)}>
            {g === 'female' ? T.parent.female : T.parent.male}
          </button>
        ))}
        <button className="secondary" onClick={() => speak(T.parent.sample, lang)} disabled={!choice}>
          {T.parent.test}
        </button>
      </div>
      {!choice && <p className="muted">{T.parent.noVoice}</p>}
      {choice && !choice.exact && <p className="muted">{T.parent.notExact(want === 'male')}</p>}
      {choice && <small className="muted">{choice.voice.name}</small>}
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

/** The version running, and "Update now": loads the newest version from the repository's site straight away. */
function UpdateCard() {
  const T = useT()
  const [state, setState] = useState<'idle' | 'looking' | 'newest' | 'offline'>('idle')
  const update = async () => {
    setState('looking')
    const found = await updateNow()
    if (found !== 'reloading') setState(found)
  }
  return (
    <section className="card parent-card">
      <h2>{T.parent.updateTitle}</h2>
      <p className="muted">{T.parent.updateNote}</p>
      <p>{T.parent.version(runningVersion())}</p>
      <div className="row">
        <button className="secondary" onClick={() => void update()} disabled={state === 'looking'}>
          {state === 'looking' ? T.parent.updating : T.parent.update}
        </button>
      </div>
      {state === 'newest' && <p className="pill">{T.parent.upToDate}</p>}
      {state === 'offline' && <p className="pill">{T.parent.updateOffline}</p>}
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
