import { Check, Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { activeChild, updateChild, withId } from '@/app/state'
import { useStore } from '@/app/store'
import { useLang, useT } from '@/i18n'
import { AGE_BANDS, type AgeBand, bandOf } from '@/skills/ages'
import { clock } from '@/shared/clock'
import { Emoji } from '@/shared/Emoji'
import { STORIES } from './storyList'
import { useAudio } from './useAudio'
import './Media.css'

const RATES = [0.75, 0.9, 1] as const

/**
 * Stories read aloud (LibriVox, public domain), by age range. Every story stands alone: one card each, with its
 * whole title, the book it comes from, and a tick once it has been heard to the end.
 */
export function Stories() {
  const T = useT()
  const lang = useLang()
  const { state, update } = useStore()
  const child = activeChild(state)
  const heard = new Set(child?.heard ?? [])
  const [band, setBand] = useState<AgeBand>(child?.age ? bandOf(child.age) : '6-7')
  const p = useAudio((id) => child && update((s) => updateChild(s, child.id, (c) => ({ ...c, heard: withId(c.heard, id) }))))
  // Books in the app language first, then each book's stories in order.
  const stories = STORIES.filter((c) => c.band === band)
    .sort((a, b) => Number(b.lang === lang) - Number(a.lang === lang))
    .flatMap((book) => book.tracks.map((track) => ({ book, track })))
  const done = stories.filter((s) => heard.has(s.track.id)).length
  return (
    <div className="listen">
      <div className="shelf-tabs" role="radiogroup">
        {AGE_BANDS.map((b) => (
          <button key={b} role="radio" aria-checked={b === band} className={b === band ? '' : 'secondary'} onClick={() => setBand(b)}>
            {T.listen.ages(b)}
          </button>
        ))}
        <span className="pill">{T.listen.heardOf(done, stories.length)}</span>
      </div>
      <div className="story-speed" role="radiogroup" aria-label={T.listen.speed}>
        <span>{T.listen.speed}</span>
        {RATES.map((r) => (
          <button key={r} role="radio" aria-checked={p.rate === r} className={p.rate === r ? '' : 'secondary'} onClick={() => p.setRate(r)}>
            <Emoji name={r === 0.75 ? 'animal-snail' : r === 0.9 ? 'animal-turtle' : 'animal-rabbit'} size={28} /> {T.listen.speeds[r === 0.75 ? 'slow' : r === 0.9 ? 'slower' : 'normal']}
          </button>
        ))}
      </div>
      <ul className="story-cards">
        {stories.map(({ book, track }) => {
          const on = p.id === track.id
          const isHeard = heard.has(track.id)
          return (
            <li key={track.id} className={`card story-card ${on ? 'on' : ''} ${isHeard ? 'heard' : ''}`}>
              <button className={`story-play ${on ? '' : 'secondary'}`} onClick={() => (on ? p.toggle() : p.play(track.id, track.url))} aria-label={on && p.state === 'playing' ? T.listen.pause : T.listen.play}>
                {on && p.state === 'playing' ? <Pause /> : <Play />}
              </button>
              <span className="story-text">
                <b className="story-title">{track.title}</b>
                <small>
                  <Emoji name={book.emoji} size={20} /> {book.title} · {book.author}
                </small>
                <small className="muted">
                  {on && p.state === 'error' ? T.listen.error : on && p.state === 'loading' ? T.listen.loading : on && p.duration ? `${clock(p.time)} / ${clock(p.duration)}` : clock(track.length)}
                </small>
              </span>
              {isHeard && (
                <span className="story-heard" title={T.listen.heard}>
                  <Check /> <span>{T.listen.heard}</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="muted listen-note">{T.listen.storiesNote}</p>
    </div>
  )
}
