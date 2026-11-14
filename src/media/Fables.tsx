import { ArrowLeft, ArrowRight, Check, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { activeChild, updateChild, withId } from '@/app/state'
import { useStore } from '@/app/store'
import { useLang, useT } from '@/i18n'
import { AGE_BANDS, type AgeBand, bandOf } from '@/skills/ages'
import { Emoji } from '@/shared/Emoji'
import { speakAlong, stopSpeaking } from '@/shared/speak'
import { type Fable, FABLES, fableKey } from './fables'
import { type Scene, scenesOf, wordAt, wordsOf } from './scenes'
import { Stage } from './Stage'
import './Media.css'

/**
 * Fables: 50 for each age range (media/fables). The child picks one and watches it as a little animated film, read by
 * Mary or Barry, thinks about what it teaches, then turns over the lesson. A fable counts as read once its lesson has
 * been shown. In English.
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

/**
 * One fable as a little animated film: scene by scene (media/scenes.ts), each scene read aloud by Mary or Barry with
 * the word being read lit up, then on to the next by itself. Pause, go back or skip at any time. Without a voice the
 * scenes still move on, at reading pace. At the end: "What is the lesson?", then the lesson.
 */
function FableCard({ fable, onBack, onNext }: { fable: Fable; onBack: () => void; onNext: () => void }) {
  const T = useT()
  const { state, update } = useStore()
  const child = activeChild(state)
  const scenes = useMemo(() => scenesOf(fable.text, fable.emoji), [fable])
  const [at, setAt] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [word, setWord] = useState(-1)
  const [shown, setShown] = useState(false)
  const done = at >= scenes.length
  const scene = scenes[Math.min(at, scenes.length - 1)]
  const words = useMemo(() => wordsOf(scene.text), [scene])
  // Read the scene, then go on to the next (the title is read before the first scene).
  useEffect(() => {
    if (!playing || done) return
    const intro = at === 0 ? `${fable.title}. ` : ''
    const next = () => {
      setWord(-1)
      setAt((a) => a + 1)
    }
    const spoken = speakAlong(intro + scene.text, 'en', { onWord: (c) => setWord(wordAt(words, c - intro.length)), onEnd: next })
    if (spoken) return stopSpeaking
    // No voice: move on at reading pace.
    const timer = setTimeout(next, 1500 + words.length * 420)
    return () => clearTimeout(timer)
  }, [at, playing, done, scene, words, fable.title])
  useEffect(() => stopSpeaking, [])
  const go = (to: number) => {
    stopSpeaking()
    setWord(-1)
    setAt(Math.max(0, Math.min(scenes.length, to)))
    setPlaying(true)
  }
  const lesson = () => {
    setShown(true)
    if (child) update((s) => updateChild(s, child.id, (c) => ({ ...c, heard: withId(c.heard, fableKey(fable)) })))
    speakAlong(fable.moral, 'en', {})
  }
  const ending: Scene = { cast: [scenes[scenes.length - 1].cast[0], 'glowstar'], backdrop: 'sky', action: 'hop', text: fable.moral }
  return (
    <div className="listen">
      <article className="card fable-card" lang="en">
        <h2>{fable.title}</h2>
        <Stage scene={done ? ending : scene} playing={playing || done} big />
        {!done && (
          <p className="fable-words">
            {words.map((w, i) => (
              <span key={i} className={i === word ? 'on' : ''}>
                {w.word}{' '}
              </span>
            ))}
          </p>
        )}
        {done &&
          (shown ? (
            <p className="fable-moral">
              <Emoji name="glowstar" size={32} /> <span>{fable.moral}</span>
            </p>
          ) : (
            <button className="big" onClick={lesson}>
              {T.fables.lesson}
            </button>
          ))}
        <div className="scene-dots" aria-hidden="true">
          {scenes.map((_, i) => (
            <i key={i} className={i === at ? 'on' : i < at ? 'seen' : ''} />
          ))}
        </div>
        <div className="row">
          <button className="secondary" onClick={onBack} aria-label={T.common.back}>
            <ArrowLeft />
          </button>
          <button className="secondary round" onClick={() => go(at - 1)} disabled={at === 0} aria-label={T.fables.previous}>
            <SkipBack />
          </button>
          {done ? (
            <button className="secondary" onClick={() => go(0)}>
              <RotateCcw /> {T.fables.again}
            </button>
          ) : (
            <button
              className="secondary"
              onClick={() => {
                if (playing) stopSpeaking()
                setWord(-1)
                setPlaying(!playing)
              }}
            >
              {playing ? <Pause /> : <Play />} {playing ? T.listen.pause : T.listen.play}
            </button>
          )}
          <button className="secondary round" onClick={() => go(at + 1)} disabled={done} aria-label={T.fables.skip}>
            <SkipForward />
          </button>
          <button className={shown ? 'big' : 'secondary'} onClick={onNext}>
            {T.fables.another} <ArrowRight />
          </button>
        </div>
      </article>
    </div>
  )
}
