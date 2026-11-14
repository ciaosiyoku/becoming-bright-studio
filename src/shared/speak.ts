import { useEffect, useState } from 'react'
import { useStore } from '@/app/store'
import type { Lang } from '@/i18n'

// Reading aloud with the device's own voices (Web Speech API). Nothing is sent anywhere by the app. A device without
// a voice for the language shows the words only (the speaker buttons hide). One thing is read at a time.
//
// Female or male voice (a family setting): browsers do not say which a voice is, so it is guessed from the voice's
// name (the usual Microsoft, Apple and Google voices are named). When the device has no voice of the chosen kind
// for a language, the nearest voice is used with a higher or lower pitch instead (voiceChoice says which).

// Few devices have a Yoruba voice: without one, the speaker buttons hide and the words are shown only.
const VARIANT: Record<Lang, string> = { en: 'en-GB', de: 'de-DE', fr: 'fr-FR', yo: 'yo-NG' }

export type VoiceGender = 'female' | 'male'

/**
 * The grown-ups' choice: the best or second-best female or male voice the device has, or no reading aloud at all
 * ("off": the words are shown, the speaker buttons hide).
 */
export type VoiceOption = 'female-1' | 'female-2' | 'male-1' | 'male-2' | 'off'
export const VOICE_OPTIONS: VoiceOption[] = ['female-1', 'female-2', 'male-1', 'male-2', 'off']

// Voice names by kind ("female" is tested first: it contains "male").
const FEMALE =
  /female|woman|zira|aria|jenny|hazel|susan|libby|sonia|maisie|natasha|clara|samantha|karen|moira|tessa|fiona|victoria|allison|ava|serena|kate|martha|nicky|katja|hedda|amala|seraphina|marlene|vicki|anna|petra|helena|julie|denise|eloise|vivienne|amelie|audrey|aurelie|celine|virginie|hortense|marie|ezinne/i
const MALE = /\bmale\b|\bman\b|david|mark|guy|george|ryan|thomas|daniel|alex|fred|arthur|oliver|james|christopher|eric|roger|aaron|gordon|rishi|stefan|conrad|killian|markus|yannick|hans|paul|henri|claude|remy|antoine|jerome|nicolas|olivier|abeo/i

/** The kind of a voice from its name, or null when the name does not tell. Pure (tested). */
export function genderOf(name: string): VoiceGender | null {
  if (FEMALE.test(name)) return 'female'
  if (MALE.test(name)) return 'male'
  return null
}

let option: VoiceOption = 'female-1'
/** The family's choice (App.tsx passes it here from the settings). */
export const setVoiceOption = (o: VoiceOption) => {
  option = o
}

/** Voices that sound like a person, by their names: natural, neural, premium or enhanced voices. */
const LIFELIKE = /natural|neural|premium|enhanced|online|wavenet|siri/i

const voicesOf = (lang: Lang) => ('speechSynthesis' in globalThis ? speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang)) : [])

type VoiceLike = { name: string; lang: string; localService: boolean }

/**
 * The voices for a kind, best first: of that kind, then of unknown kind, then of the other kind; among those, the
 * ones that sound most like a person first, then Google's, then the ones on the device (they work offline), then
 * the usual regional variant. Pure (tested).
 */
export function rankVoices<V extends VoiceLike>(voices: V[], lang: Lang, want: VoiceGender): V[] {
  const score = (v: V) => {
    const g = genderOf(v.name)
    return (g === want ? 1000 : g === null ? 500 : 0) + (LIFELIKE.test(v.name) ? 40 : 0) + (/google/i.test(v.name) ? 20 : 0) + (v.localService ? 4 : 0) + (v.lang === VARIANT[lang] ? 1 : 0)
  }
  return [...voices].sort((a, b) => score(b) - score(a))
}

/** How one choice reads: its voice, pitch and speed. `exact`: the voice really is of the chosen kind; `shared`: the
 * device has too few voices, so this voice also reads another choice (pitch and speed tell them apart). */
export interface VoicePick<V> {
  voice: V
  exact: boolean
  shared: boolean
  pitch: number
  rate: number
}

/** Pitch and speed per choice when its voice is not of its kind or is shared: clearly apart, still natural. */
const TUNE: Record<Exclude<VoiceOption, 'off'>, { pitch: number; rate: number }> = {
  'female-1': { pitch: 1.12, rate: 0.9 },
  'female-2': { pitch: 1.32, rate: 0.96 },
  'male-1': { pitch: 0.8, rate: 0.88 },
  'male-2': { pitch: 0.64, rate: 0.84 },
}

/**
 * The four voices, in three rounds, each taking the best voice not taken yet (Female 1, Male 1, Female 2, Male 2
 * in turn): first a voice of the choice's own kind; then any voice left, of unknown kind first (tablets often name
 * voices only by accent: "English United Kingdom", "English United States" …, so different accents still give
 * different voices); last, voice 2 shares voice 1 of its kind (voice 1 shares the best of its kind). A voice of the
 * right kind, not shared, reads as it is; any other gets its own pitch and speed, so each choice sounds different.
 * null: the device has no voice for the language. Pure (tested).
 */
export function voicePlan<V extends VoiceLike>(voices: V[], lang: Lang): Record<Exclude<VoiceOption, 'off'>, VoicePick<V>> | null {
  if (!voices.length) return null
  type Choice = Exclude<VoiceOption, 'off'>
  const order: Choice[] = ['female-1', 'male-1', 'female-2', 'male-2']
  const kind = (c: Choice): VoiceGender => (c.startsWith('male') ? 'male' : 'female')
  const taken = new Set<V>()
  const got: Partial<Record<Choice, { voice: V; shared: boolean }>> = {}
  const take = (c: Choice, voice: V | undefined) => {
    if (!voice || got[c]) return
    taken.add(voice)
    got[c] = { voice, shared: false }
  }
  // 1. A voice of the choice's own kind.
  for (const c of order) take(c, rankVoices(voices, lang, kind(c)).find((v) => !taken.has(v) && genderOf(v.name) === kind(c)))
  // 2. Any voice left (unknown kind first: rankVoices puts it before the other kind).
  for (const c of order) take(c, rankVoices(voices, lang, kind(c)).find((v) => !taken.has(v)))
  // 3. Too few voices: share.
  for (const c of order) {
    if (got[c]) continue
    const one = got[`${kind(c)}-1` as Choice]
    got[c] = { voice: c.endsWith('2') && one ? one.voice : rankVoices(voices, lang, kind(c))[0], shared: true }
  }
  const plan = {} as Record<Choice, VoicePick<V>>
  for (const c of order) {
    const { voice, shared } = got[c]!
    const exact = genderOf(voice.name) === kind(c)
    plan[c] = { voice, exact, shared, ...(exact && !shared ? { pitch: 1, rate: 0.9 } : TUNE[c]) }
  }
  // Voice 2 must not sound like voice 1.
  for (const [one, two] of [['female-1', 'female-2'], ['male-1', 'male-2']] as const) {
    if (plan[one].voice === plan[two].voice && plan[one].pitch === plan[two].pitch) plan[two] = { ...plan[two], shared: true, ...TUNE[two] }
  }
  return plan
}

/** The voice for a choice, or null when reading aloud is off or the device has no voice. Pure (tested). */
export function pickVoice<V extends VoiceLike>(voices: V[], lang: Lang, choice: VoiceOption): VoicePick<V> | null {
  if (choice === 'off') return null
  return voicePlan(voices, lang)?.[choice] ?? null
}

/** A voice's name, short: "Microsoft Libby Online (Natural) - English (United Kingdom)" → "Libby Online". */
export const shortName = (name: string) =>
  name
    .replace(/^(microsoft|google|apple|samsung|android)\s+/i, '')
    .split(/\s[-–(]|\s\(/)[0]
    .trim() || name

/** Reads a sentence aloud (stopping whatever was being read). */
export function speak(text: string, lang: Lang) {
  const picked = pickVoice(voicesOf(lang), lang, option)
  if (!picked) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = picked.voice
  u.lang = picked.voice.lang
  u.rate = picked.rate
  u.pitch = picked.pitch
  speechSynthesis.speak(u)
}

export const stopSpeaking = () => {
  if ('speechSynthesis' in globalThis) speechSynthesis.cancel()
}

/** The voices of a language, updated when the browser has loaded them (they often arrive after the page). */
function useVoices(lang: Lang): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(() => voicesOf(lang))
  useEffect(() => {
    if (!('speechSynthesis' in globalThis)) return
    const update = () => setVoices(voicesOf(lang))
    update()
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [lang])
  return voices
}

/** True when the device can read in this language and reading aloud is on (else the speaker buttons hide). */
export function useCanSpeak(lang: Lang): boolean {
  const off = useStore().state.family.voice === 'off'
  const voices = useVoices(lang)
  return !off && voices.length > 0
}

/** The voice that will read a language for a choice (for the grown-ups' screen). */
export function useVoiceChoice(lang: Lang, choice: VoiceOption) {
  return pickVoice(useVoices(lang), lang, choice)
}

/** All four choices' voices (the grown-ups' screen shows each one's name). */
export function useVoicePlan(lang: Lang) {
  return voicePlan(useVoices(lang), lang)
}
