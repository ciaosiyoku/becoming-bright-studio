import { useEffect, useRef, useState } from 'react'

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

/**
 * One audio player owned by a screen: it stops when the screen closes, so nothing plays on after the child leaves
 * (or after earned time runs out and the item closes).
 */
export function useAudio(onFinished?: (id: string) => void) {
  const ref = useRef<HTMLAudioElement | null>(null)
  // The track playing and whether it has been reported as finished (heard to the end, or 95 % of it).
  const playing = useRef<{ id: string | null; done: boolean }>({ id: null, done: false })
  const finished = useRef(onFinished)
  useEffect(() => {
    finished.current = onFinished
  })
  const [id, setId] = useState<string | null>(null)
  const [state, setState] = useState<AudioState>('idle')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRateState] = useState(1)

  useEffect(() => {
    const a = new Audio()
    ref.current = a
    a.onplaying = () => setState('playing')
    a.onpause = () => setState((s) => (s === 'error' ? s : 'paused'))
    a.onwaiting = () => setState('loading')
    a.onerror = () => setState('error')
    const finish = () => {
      const p = playing.current
      if (p.id && !p.done) {
        p.done = true
        finished.current?.(p.id)
      }
    }
    a.ontimeupdate = () => {
      setTime(a.currentTime)
      if (Number.isFinite(a.duration) && a.duration > 0 && a.currentTime / a.duration >= 0.95) finish()
    }
    a.ondurationchange = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0)
    a.onended = () => {
      finish()
      setState('idle')
    }
    return () => {
      a.pause()
      a.removeAttribute('src')
      a.load()
      ref.current = null
    }
  }, [])

  const play = (next: string, url: string) => {
    const a = ref.current
    if (!a) return
    setId(next)
    playing.current = { id: next, done: false }
    setState('loading')
    setTime(0)
    setDuration(0)
    a.src = url
    a.playbackRate = rate
    a.play().catch(() => setState('error'))
  }
  const toggle = () => {
    const a = ref.current
    if (!a) return
    if (a.paused) a.play().catch(() => setState('error'))
    else a.pause()
  }
  const stop = () => {
    const a = ref.current
    if (!a) return
    a.pause()
    a.removeAttribute('src')
    a.load()
    setId(null)
    setState('idle')
  }
  /** Jumps to a time in the recording (seconds). */
  const seek = (t: number) => {
    const a = ref.current
    if (!a || !Number.isFinite(a.duration)) return
    a.currentTime = Math.max(0, Math.min(a.duration - 1, t))
    setTime(a.currentTime)
  }
  const setRate = (r: number) => {
    setRateState(r)
    if (ref.current) ref.current.playbackRate = r
  }
  return { id, state, time, duration, rate, play, toggle, stop, seek, setRate }
}
