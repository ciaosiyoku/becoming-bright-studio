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

/**
 * The voice for a choice, and how it reads: Female 1 and Male 1 are the best voice of that kind, Female 2 and Male 2
 * the next one. A device with only one voice of the kind uses it for both, voice 2 a little higher (female) or lower
 * (male) so they still sound different. With no voice of the kind, the nearest one reads higher or lower. `exact`:
 * really of that kind; `same`: voice 2 is voice 1 again. null: reading aloud is off, or the device has no voice.
 * Pure (tested).
 */
export function pickVoice<V extends VoiceLike>(voices: V[], lang: Lang, choice: VoiceOption): { voice: V; exact: boolean; same: boolean; pitch: number } | null {
  if (choice === 'off') return null
  const [want, nth] = choice.split('-') as [VoiceGender, '1' | '2']
  const ranked = rankVoices(voices, lang, want)
  if (!ranked.length) return null
  const ofKind = ranked.filter((v) => genderOf(v.name) === want)
  const exact = ofKind.length > 0
  const second = nth === '2'
  const voice = second && ofKind.length >= 2 ? ofKind[1] : ranked[0]
  const same = second && ofKind.length < 2
  // No voice of the kind: the nearest reads higher for female, lower for male; voice 2 a little more again.
  const shift = (exact ? 0 : 0.2) + (same ? 0.12 : 0)
  return { voice, exact, same, pitch: want === 'male' ? 1 - shift : 1 + shift }
}

/** Reads a sentence aloud (stopping whatever was being read). */
export function speak(text: string, lang: Lang) {
  const picked = pickVoice(voicesOf(lang), lang, option)
  if (!picked) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = picked.voice
  u.lang = picked.voice.lang
  u.rate = 0.9
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
