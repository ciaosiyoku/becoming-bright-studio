import { ArrowLeft, Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { useT } from '@/i18n'
import { clock } from '@/shared/clock'
import { Emoji } from '@/shared/Emoji'
import { COLLECTIONS, type Collection } from './sources'
import { useAudio } from './useAudio'
import './Media.css'

const RATES = [0.75, 0.9, 1] as const

/** Classic children's books read aloud (LibriVox, public domain): pick a book, then a story. */
export function Stories() {
  const T = useT()
  const [open, setOpen] = useState<Collection | null>(null)
  return (
    <div className="listen">
      {open ? (
        <CollectionView collection={open} onBack={() => setOpen(null)} />
      ) : (
        <div className="listen-grid">
          {COLLECTIONS.map((c) => (
            <button key={c.id} className="card station" onClick={() => setOpen(c)}>
              <Emoji name={c.emoji} size={72} />
              <span>
                <h3>{c.title}</h3>
                <small>
                  {c.author} · {T.listen.stories(c.tracks.length)}
                </small>
              </span>
            </button>
          ))}
          <p className="muted listen-note">{T.listen.storiesNote}</p>
        </div>
      )}
    </div>
  )
}

function CollectionView({ collection, onBack }: { collection: Collection; onBack: () => void }) {
  const T = useT()
  const p = useAudio()
  return (
    <div className="card story-list">
      <h3 className="card-title">
        <button className="secondary" onClick={onBack} aria-label={T.common.back}>
          <ArrowLeft />
        </button>
        <Emoji name={collection.emoji} size={40} /> {collection.title}
      </h3>
      <div className="story-speed" role="radiogroup" aria-label={T.listen.speed}>
        <span>{T.listen.speed}</span>
        {RATES.map((r) => (
          <button key={r} role="radio" aria-checked={p.rate === r} className={p.rate === r ? '' : 'secondary'} onClick={() => p.setRate(r)}>
            <Emoji name={r === 0.75 ? 'animal-snail' : r === 0.9 ? 'animal-turtle' : 'animal-rabbit'} size={28} /> {T.listen.speeds[r === 0.75 ? 'slow' : r === 0.9 ? 'slower' : 'normal']}
          </button>
        ))}
      </div>
      <ol>
        {collection.tracks.map((tr) => {
          const on = p.id === tr.id
          return (
            <li key={tr.id} className={on ? 'on' : ''}>
              <button className={on ? '' : 'secondary'} onClick={() => (on ? p.toggle() : p.play(tr.id, tr.url))} aria-label={on && p.state === 'playing' ? T.listen.pause : T.listen.play}>
                {on && p.state === 'playing' ? <Pause /> : <Play />}
              </button>
              <span>
                <b>{tr.title}</b>
                <small className="muted">
                  {on && p.state === 'error' ? T.listen.error : on && p.state === 'loading' ? T.listen.loading : on && p.duration ? `${clock(p.time)} / ${clock(p.duration)}` : clock(tr.length)}
                </small>
              </span>
            </li>
          )
        })}
      </ol>
      <small className="muted">
        {T.listen.credit(collection.author)}{' '}
        <a href={collection.source} target="_blank" rel="noreferrer">
          archive.org
        </a>
      </small>
    </div>
  )
}
