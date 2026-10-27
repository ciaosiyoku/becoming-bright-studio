import { useEffect, useRef, useState } from 'react'

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

/**
 * One audio player owned by a screen: it stops when the screen closes, so nothing plays on after the child leaves
 * (or after earned time runs out and the item closes).
 */
export function useAudio() {
  const ref = useRef<HTMLAudioElement | null>(null)
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
    a.ontimeupdate = () => setTime(a.currentTime)
    a.ondurationchange = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0)
    a.onended = () => setState('idle')
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
  const setRate = (r: number) => {
    setRateState(r)
    if (ref.current) ref.current.playbackRate = r
  }
  return { id, state, time, duration, rate, play, toggle, stop, setRate }
}
