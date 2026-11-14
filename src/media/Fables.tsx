import { ArrowLeft, ArrowRight, Check, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { activeChild, updateChild, withId } from '@/app/state'
import { useStore } from '@/app/store'
import { useLang, useT } from '@/i18n'
import { AGE_BANDS, type AgeBand, bandOf } from '@/skills/ages'
import { Emoji } from '@/shared/Emoji'
import { speak, stopSpeaking, useCanSpeak } from '@/shared/speak'
import { type Fable, FABLES, fableKey } from './fables'
import './Media.css'

/**
 * Fables: 20 for each age range (media/fables). The child picks one, hears or reads it, thinks about what it teaches,
 * then turns over the lesson. A fable counts as read once its lesson has been shown. In English, read by Mary or Barry.
 */
export function Fables() {
  const T = useT()
  const lang = useLang()
  const { state } = useStore()
  const child = activeChild(state)
  const heard = new Set(child?.heard ?? [])
  const [band, setBand] = useState<AgeBand>(child?.age ? bandOf(child.age) : '6-7')
  const [open, setOpen] = useState<number | null>(null)
  const list = FABLES[band]
  if (open !== null && list[open]) return <FableCard key={list[open].id} fable={list[open]} onBack={() => setOpen(null)} onNext={() => setOpen((open + 1) % list.length)} />
  return (
    <div className="listen">
      <div className="shelf-tabs" role="radiogroup">
        {AGE_BANDS.map((b) => (
          <button key={b} role="radio" aria-checked={b === band} className={b === band ? '' : 'secondary'} onClick={() => setBand(b)}>
            {T.listen.ages(b)}
          </button>
        ))}
        <span className="pill">{T.fables.readOf(list.filter((f) => heard.has(fableKey(f))).length, list.length)}</span>
      </div>
      <ul className="fable-list">
        {list.map((f, i) => (
          <li key={f.id}>
            <button className={`card fable-tile ${heard.has(fableKey(f)) ? 'read' : ''}`} onClick={() => setOpen(i)}>
              <span className="fable-icon">
                <Emoji name={f.emoji} size={44} />
              </span>
              <span className="fable-name">
                <b>{f.title}</b>
                <small>{T.fables.from[f.from]}</small>
              </span>
              {heard.has(fableKey(f)) && <Check className="fable-tick" aria-label={T.fables.read} />}
            </button>
          </li>
        ))}
      </ul>
      {lang !== 'en' && <p className="muted listen-note">{T.fables.inEnglish}</p>}
    </div>
  )
}

/** One fable: the story (read aloud on a tap), then "What is the lesson?", then the lesson. */
function FableCard({ fable, onBack, onNext }: { fable: Fable; onBack: () => void; onNext: () => void }) {
  const T = useT()
  const speaks = useCanSpeak('en')
  const { state, update } = useStore()
  const child = activeChild(state)
  const [shown, setShown] = useState(false)
  const story = `${fable.title}. ${fable.text.join(' ')}`
  useEffect(() => stopSpeaking, [])
  const hear = () => speak(shown ? `${story} ${fable.moral}` : story, 'en')
  const lesson = () => {
    setShown(true)
    if (child) update((s) => updateChild(s, child.id, (c) => ({ ...c, heard: withId(c.heard, fableKey(fable)) })))
    speak(fable.moral, 'en')
  }
  return (
    <div className="listen">
      <article className="card fable-card" lang="en">
        <Emoji name={fable.emoji} size={110} />
        <h2>{fable.title}</h2>
        <small className="muted">{T.fables.from[fable.from]}</small>
        {fable.text.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {shown ? (
          <p className="fable-moral">
            <Emoji name="glowstar" size={32} /> <span>{fable.moral}</span>
          </p>
        ) : (
          <button className="big" onClick={lesson}>
            {T.fables.lesson}
          </button>
        )}
        <div className="row">
          <button className="secondary" onClick={onBack} aria-label={T.common.back}>
            <ArrowLeft />
          </button>
          {speaks && (
            <button className="secondary" onClick={hear}>
              <Volume2 /> {T.lesson.hear}
            </button>
          )}
          <button className={shown ? 'big' : 'secondary'} onClick={onNext}>
            {T.fables.another} <ArrowRight />
          </button>
        </div>
      </article>
    </div>
  )
}
