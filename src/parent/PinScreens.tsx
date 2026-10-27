import { Delete, Printer, X } from 'lucide-react'
import { type ChangeEvent, type ReactNode, useRef, useState } from 'react'
import { useStore } from '@/app/store'
import { BackupError, parseBackup } from '@/data/backup'
import { useT } from '@/i18n'
import { afterWrongPin, lockSecondsLeft, makePin, NO_LOCK, newRecoveryCode, normalizeCode, PIN_LENGTH, pinMatches, type PinHash } from './pin'
import './PinScreens.css'

/** A big number pad for 4 digits; calls onPin when the 4th digit is typed. */
function PinPad({ title, note, error, onPin, onClose, footer }: { title: string; note?: string; error?: string; onPin: (pin: string) => void; onClose?: () => void; footer?: ReactNode }) {
  const T = useT()
  const [digits, setDigits] = useState('')
  const press = (d: string) => {
    const next = digits + d
    if (next.length < PIN_LENGTH) return setDigits(next)
    setDigits('')
    onPin(next)
  }
  return (
    <div className="pin-backdrop">
      <section className="card pin-card" role="dialog" aria-label={title}>
        {onClose && (
          <button className="secondary pin-close" onClick={onClose} aria-label={T.common.cancel}>
            <X />
          </button>
        )}
        <h2>{title}</h2>
        {note && <p className="muted">{note}</p>}
        <div className="pin-dots" aria-hidden>
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <i key={i} className={i < digits.length ? 'on' : ''} />
          ))}
        </div>
        {error && <p className="pin-error">{error}</p>}
        <div className="pin-keys">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} className="secondary" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <span />
          <button className="secondary" onClick={() => press('0')}>
            0
          </button>
          <button className="secondary" onClick={() => setDigits(digits.slice(0, -1))} aria-label={T.pin.delete}>
            <Delete />
          </button>
        </div>
        {footer}
      </section>
    </div>
  )
}

/** Choosing a PIN: typed twice, then a new recovery code shown once. Returns both hashes. */
export function ChoosePin({ title, note, onDone, onClose }: { title?: string; note?: string; onDone: (pin: PinHash, recovery: PinHash) => void; onClose?: () => void }) {
  const T = useT()
  const [first, setFirst] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [code, setCode] = useState<{ text: string; pin: PinHash; recovery: PinHash } | null>(null)
  const onPin = async (pin: string) => {
    if (first === null) {
      setFirst(pin)
      return setError('')
    }
    if (pin !== first) {
      setFirst(null)
      return setError(T.pin.differ)
    }
    const text = newRecoveryCode()
    const [hash, recovery] = await Promise.all([makePin(pin), makePin(normalizeCode(text))])
    setCode({ text, pin: hash, recovery })
  }
  if (code) return <RecoveryCode code={code.text} onDone={() => onDone(code.pin, code.recovery)} />
  return <PinPad title={first === null ? (title ?? T.pin.create) : T.pin.confirm} note={note} error={error} onPin={(p) => void onPin(p)} onClose={onClose} />
}

/** The recovery code, shown once, with a print button. */
export function RecoveryCode({ code, onDone }: { code: string; onDone: () => void }) {
  const T = useT()
  return (
    <div className="pin-backdrop">
      <section className="card pin-card recovery-card">
        <h2>{T.recovery.title}</h2>
        <p className="recovery-code">{code}</p>
        <p>{T.recovery.text}</p>
        <div className="row center">
          <button className="secondary" onClick={() => window.print()}>
            <Printer /> {T.recovery.print}
          </button>
          <button onClick={onDone}>{T.recovery.saved}</button>
        </div>
      </section>
    </div>
  )
}

/**
 * Asks for the PIN before the grown-ups' screen. Wrong tries are kept in the state, and each block of 5 waits
 * longer (pin.ts). "Forgot the PIN?": the recovery code, or starting again from a backup. No 24-hour reset.
 */
export function PinGate({ onOpen, onClose }: { onOpen: () => void; onClose: () => void }) {
  const T = useT()
  const { state, update } = useStore()
  const family = state.family
  const [mode, setMode] = useState<'enter' | 'forgot' | 'new'>('enter')
  const [error, setError] = useState(() => {
    const wait = lockSecondsLeft(family.pinLock, Date.now())
    return wait > 0 ? T.pin.wait(wait) : ''
  })

  const onPin = async (pin: string) => {
    const waiting = lockSecondsLeft(family.pinLock, Date.now())
    if (waiting > 0) return setError(T.pin.wait(waiting))
    if (await pinMatches(pin, family.pin)) {
      if (family.pinLock.wrong > 0) update((s) => ({ ...s, family: { ...s.family, pinLock: NO_LOCK } }))
      return onOpen()
    }
    let lock = family.pinLock
    update((s) => {
      lock = afterWrongPin(s.family.pinLock, Date.now())
      return { ...s, family: { ...s.family, pinLock: lock } }
    })
    const wait = lockSecondsLeft(lock, Date.now())
    setError(wait > 0 ? T.pin.wait(wait) : T.pin.wrong)
  }

  if (mode === 'new')
    return (
      <ChoosePin
        onClose={onClose}
        onDone={(pin, recovery) => {
          update((s) => ({ ...s, family: { ...s.family, pin, recovery, pinLock: NO_LOCK } }))
          onOpen()
        }}
      />
    )
  if (mode === 'forgot') return <Forgot onCode={() => setMode('new')} onBack={() => setMode('enter')} onClose={onClose} />
  return (
    <PinPad
      title={T.pin.enter}
      error={error}
      onPin={(p) => void onPin(p)}
      onClose={onClose}
      footer={
        <button className="link-button" onClick={() => setMode('forgot')}>
          {T.pin.forgot}
        </button>
      }
    />
  )
}

/** A forgotten PIN: type the recovery code, or start again from a backup (which then asks for a new PIN). */
function Forgot({ onCode, onBack, onClose }: { onCode: () => void; onBack: () => void; onClose: () => void }) {
  const T = useT()
  const { state, replace } = useStore()
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const check = async () => {
    if (state.family.recovery && (await pinMatches(normalizeCode(typed), state.family.recovery))) return onCode()
    setError(T.recovery.codeWrong)
  }
  const startAgain = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const restored = parseBackup(await f.text())
      if (!confirm(T.recovery.confirmStartAgain)) return
      // The backup has no PIN: the app asks for a new one before anything else (App.tsx).
      replace(restored)
      onClose()
    } catch (err) {
      setError(err instanceof BackupError ? T.parent.errors[err.reason] : String(err))
    }
  }
  return (
    <div className="pin-backdrop">
      <section className="card pin-card forgot">
        <button className="secondary pin-close" onClick={onClose} aria-label={T.common.cancel}>
          <X />
        </button>
        <h2>{T.recovery.forgotTitle}</h2>
        <label className="field">
          <span>{T.recovery.codeLabel}</span>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="XXXX-XXXX-XXXX" autoCapitalize="characters" />
        </label>
        <button onClick={() => void check()} disabled={normalizeCode(typed).length < 12}>
          {T.recovery.check}
        </button>
        {error && <p className="pin-error">{error}</p>}
        <p className="muted">{T.recovery.noCode}</p>
        <button className="secondary" onClick={() => file.current?.click()}>
          {T.recovery.fromBackup}
        </button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => void startAgain(e)} />
        <button className="link-button" onClick={onBack}>
          {T.common.back}
        </button>
      </section>
    </div>
  )
}
