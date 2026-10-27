import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { type LibraryVideo, shelfVideos, VIDEO_SHELVES } from './library'
import { embedUrl, thumbnail } from './sources'
import './Media.css'

const SHELF_EMOJI = { made: 'factory', works: 'gear', cams: 'paws' } as const

/** The video library: shelves of checked videos from official channels; a video plays inside the app. */
export function Videos() {
  const T = useT()
  const lang = useLang()
  const [playing, setPlaying] = useState<LibraryVideo | null>(null)
  if (playing) {
    const v = { kind: 'video' as const, id: playing.id }
    return (
      <div className="listen">
        <h3 className="shelf-title">
          <button className="secondary" onClick={() => setPlaying(null)} aria-label={T.common.back}>
            <ArrowLeft />
          </button>
          {playing.title}
        </h3>
        {/* No popups and no navigating away from the app. */}
        <iframe className="video-frame" src={embedUrl(v)} title={playing.title} allow="autoplay; fullscreen; encrypted-media" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" />
      </div>
    )
  }
  return (
    <div className="listen">
      <div className="video-shelves">
        {VIDEO_SHELVES.map((shelf) => (
          <section key={shelf}>
            <h3 className="shelf-title">
              <Emoji name={SHELF_EMOJI[shelf]} size={30} /> {T.videos.shelves[shelf]}
            </h3>
            {shelf === 'cams' && <small className="muted">{T.videos.camsNote}</small>}
            <div className="listen-grid">
              {shelfVideos(shelf, lang).map((v) => (
                <button key={v.id} className="card video-card" onClick={() => setPlaying(v)}>
                  <img src={thumbnail({ kind: 'video', id: v.id }) ?? ''} alt="" loading="lazy" />
                  {v.live && <span className="pill live video-live">{T.listen.live}</span>}
                  <b>{v.title}</b>
                  <small className="muted">{v.channel}</small>
                </button>
              ))}
            </div>
          </section>
        ))}
        <p className="muted listen-note">{T.videos.libraryNote}</p>
      </div>
    </div>
  )
}
