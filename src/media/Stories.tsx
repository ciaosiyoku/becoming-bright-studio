import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { activeChild, updateChild, withId } from '@/app/state'
import { useStore } from '@/app/store'
import { useLang, useT } from '@/i18n'
import { AGE_BANDS, type AgeBand, bandOf } from '@/skills/ages'
import { clock } from '@/shared/clock'
import { Emoji } from '@/shared/Emoji'
import { scenesOf, storyScene } from './scenes'
import type { Track } from './sources'
import { loadStoryText, paragraphAt, paragraphStarts } from './storyText'
import { Stage } from './Stage'
import { STORIES } from './storyList'
import { useAudio } from './useAudio'
import './Media.css'

const RATES = [0.75, 0.9, 1] as const

/**
 * Stories read aloud (LibriVox, public domain), by age range. Every story stands alone: one card each, with its
 * whole title, the book it comes from, and a tick once it has been heard to the end. Tapping a story opens its own
 * page, where it plays like the fables (an animated scene for the part being read, with its words; storyText.ts), with
 * buttons for the previous or next story and back to all stories. The recording keeps playing on the list.
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
  // The story open on its own page (index in the list), or null for the list.
  const [open, setOpen] = useState<number | null>(null)
  const start = (i: number) => {
    const s = stories[i]
    if (!s) return
    setOpen(i)
    if (p.id !== s.track.id) p.play(s.track.id, s.track.url)
  }
  if (open !== null && stories[open]) {
    const { book, track } = stories[open]
    return (
      <div className="listen with-film">
        <StoryFilm key={track.id} book={book.id} emoji={book.emoji} track={track} p={p} />
        <div className="story-nav">
          <button className="secondary" onClick={() => setOpen(null)}>
            <ArrowLeft /> {T.listen.allStories}
          </button>
          <button className="secondary" onClick={() => start(open - 1)} disabled={open === 0}>
            <ChevronLeft /> {T.listen.previousStory}
          </button>
          <button className="secondary" onClick={() => start(open + 1)} disabled={open === stories.length - 1}>
            {T.listen.nextStory} <ChevronRight />
          </button>
        </div>
        <small className="muted story-of">
          <Emoji name={book.emoji} size={20} /> {book.title} · {book.author} · {T.listen.storyOf(open + 1, stories.length)}
        </small>
      </div>
    )
  }
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
              <button className="story-open" onClick={() => start(stories.findIndex((s) => s.track.id === track.id))} aria-label={T.listen.openStory(track.title)}>
                <BookOpen />
              </button>
              <span className="story-text" onClick={() => start(stories.findIndex((s) => s.track.id === track.id))}>
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

/**
 * The story playing, like a fable film: the recording (a human reader) plays, and the scene and words follow the part
 * being read (the time shared out over the paragraphs, so a guess). Back and next jump to the part before or after.
 * Recordings without a text show one scene made from their title.
 */
function StoryFilm({ book, emoji, track, p }: { book: string; emoji: string; track: Track; p: ReturnType<typeof useAudio> }) {
  const T = useT()
  const [paras, setParas] = useState<string[] | null>(null)
  useEffect(() => {
    let on = true
    void loadStoryText(book).then((t) => on && setParas(t?.[track.id] ?? null))
    return () => {
      on = false
    }
  }, [book, track.id])
  const duration = p.duration || track.length
  const scenes = useMemo(() => (paras ? scenesOf(paras, emoji) : null), [paras, emoji])
  const starts = useMemo(() => (paras ? paragraphStarts(paras, duration) : []), [paras, duration])
  const at = scenes ? paragraphAt(starts, p.time) : 0
  const scene = scenes ? scenes[at] : storyScene(track.title, emoji)
  return (
    <section className="card story-stage">
      <Stage scene={scene} playing={p.state === 'playing'} />
      {scenes && <p className="story-words">{scenes[at].text}</p>}
      <div className="story-now">
        {scenes && (
          <button className="secondary round" onClick={() => p.seek(starts[Math.max(0, at - 1)])} disabled={at === 0} aria-label={T.fables.previous}>
            <SkipBack />
          </button>
        )}
        <button className="story-play" onClick={() => p.toggle()} aria-label={p.state === 'playing' ? T.listen.pause : T.listen.play}>
          {p.state === 'playing' ? <Pause /> : <Play />}
        </button>
        {scenes && (
          <button className="secondary round" onClick={() => p.seek(starts[Math.min(starts.length - 1, at + 1)])} disabled={at >= starts.length - 1} aria-label={T.fables.skip}>
            <SkipForward />
          </button>
        )}
        <span className="story-text">
          <b className="story-title">{track.title}</b>
          <small className="muted">{p.state === 'error' ? T.listen.error : p.state === 'loading' ? T.listen.loading : p.duration ? `${clock(p.time)} / ${clock(p.duration)}` : ''}</small>
        </span>
      </div>
      <span className="story-progress" aria-hidden="true">
        <i style={{ width: `${p.duration ? Math.min(100, (p.time / p.duration) * 100) : 0}%` }} />
      </span>
    </section>
  )
}
