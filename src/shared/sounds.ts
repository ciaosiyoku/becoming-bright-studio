// Soft sound effects, made on the device (Web Audio): no sound files to download, nothing sent anywhere.
// A grown-ups' setting turns them off (family.sounds; App.tsx passes it here). A miss never buzzes: a low, gentle
// "hmm", then the reason is read aloud as before. Quiet on purpose, so the reading voice is always the loudest.

export type Sound = 'tap' | 'right' | 'miss' | 'done'

/** One note: frequency (Hz), start and length (seconds), and the wave. */
export interface Note {
  hz: number
  /** The frequency at the end (a glide), or the same. */
  toHz: number
  at: number
  length: number
  wave: OscillatorType
}

const note = (hz: number, at: number, length: number, wave: OscillatorType = 'sine', toHz = hz): Note => ({ hz, toHz, at, length, wave })

/** The notes of each sound. Pure (tested). */
export function notesOf(sound: Sound): Note[] {
  switch (sound) {
    case 'tap':
      return [note(660, 0, 0.06)]
    case 'right':
      // Two rising chimes (C6, E6).
      return [note(1047, 0, 0.14, 'triangle'), note(1319, 0.12, 0.22, 'triangle')]
    case 'miss':
      // A soft "hmm", gliding down a little.
      return [note(330, 0, 0.28, 'sine', 294)]
    case 'done':
      // A short tune as the tree grows (C5, E5, G5, C6).
      return [note(523, 0, 0.16, 'triangle'), note(659, 0.15, 0.16, 'triangle'), note(784, 0.3, 0.16, 'triangle'), note(1047, 0.45, 0.4, 'triangle')]
  }
}

/** How loud (0–1). Low: the sounds sit under the reading voice. */
const VOLUME = 0.12

let on = true
/** The family's choice (App.tsx passes it here from the settings). */
export const setSoundsOn = (value: boolean) => {
  on = value
}

let audio: AudioContext | null = null

/** Plays a sound, unless sounds are off or the device can't. Never throws. */
export function playSound(sound: Sound) {
  if (!on) return
  try {
    const Ctx = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = (audio ??= new Ctx())
    if (ctx.state === 'suspended') void ctx.resume()
    const start = ctx.currentTime + 0.01
    for (const n of notesOf(sound)) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = n.wave
      osc.frequency.setValueAtTime(n.hz, start + n.at)
      if (n.toHz !== n.hz) osc.frequency.linearRampToValueAtTime(n.toHz, start + n.at + n.length)
      // A soft start and end, so there is no click.
      gain.gain.setValueAtTime(0, start + n.at)
      gain.gain.linearRampToValueAtTime(VOLUME, start + n.at + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.at + n.length)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start + n.at)
      osc.stop(start + n.at + n.length + 0.02)
    }
  } catch {
    // No sound on this device: the lesson works the same.
  }
}
