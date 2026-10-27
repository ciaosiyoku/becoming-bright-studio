import { ArrowLeft } from 'lucide-react'
import { type ChangeEvent, useRef, useState } from 'react'
import { useStore } from '@/app/store'
import { BackupError, backupDue, makeBackup, parseBackup, saveBackupFile } from '@/data/backup'
import { useT } from '@/i18n'
import './Parent.css'

/** The parent screen. */
export function Parent({ onClose }: { onClose: () => void }) {
  const T = useT()
  return (
    <main className="parent">
      <header className="parent-top">
        <button className="secondary" onClick={onClose}>
          <ArrowLeft /> {T.common.back}
        </button>
        <h1>{T.parent.title}</h1>
      </header>
      <BackupCard />
    </main>
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
      replace(restored)
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
