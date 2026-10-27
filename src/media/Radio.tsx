import { Play, Square } from 'lucide-react'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { stationsFor } from './sources'
import { useAudio } from './useAudio'
import './Media.css'

/** Children's radio stations, live; the ones in the app language first. */
export function Radio() {
  const T = useT()
  const lang = useLang()
  const p = useAudio()
  return (
    <div className="listen">
      <div className="listen-grid">
        {stationsFor(lang).map((s) => {
          const on = p.id === s.id
          return (
            <button key={s.id} className={`card station ${on ? 'on' : ''}`} onClick={() => (on ? p.stop() : p.play(s.id, s.url))}>
              <Emoji name={s.emoji} size={72} />
              <span>
                <h3>{s.name}</h3>
                <small>{on && p.state === 'loading' ? T.listen.loading : on && p.state === 'error' ? T.listen.error : T.stations[s.id as keyof typeof T.stations]}</small>
              </span>
              <span className="station-go">{on ? <Square fill="currentColor" /> : <Play fill="currentColor" />}</span>
              {on && p.state === 'playing' && <span className="pill live">● {T.listen.live}</span>}
            </button>
          )
        })}
        <p className="muted listen-note">{T.listen.radioNote}</p>
      </div>
    </div>
  )
}
