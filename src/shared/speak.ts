import { useEffect, useState } from 'react'
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

let gender: VoiceGender = 'female'
/** The family's choice (App.tsx passes it here from the settings). */
export const setVoiceGender = (g: VoiceGender) => {
  gender = g
}

const voicesOf = (lang: Lang) => ('speechSynthesis' in globalThis ? speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang)) : [])

/**
 * The voice for a language and kind: one of that kind (on the device first, then the usual regional variant), else
 * one whose kind is unknown, else the other kind. `exact` says whether it is of the chosen kind. Pure (tested).
 */
export function pickVoice<V extends { name: string; lang: string; localService: boolean }>(voices: V[], lang: Lang, want: VoiceGender): { voice: V; exact: boolean } | null {
  const score = (v: V) => {
    const g = genderOf(v.name)
    return (g === want ? 100 : g === null ? 50 : 0) + (v.localService ? 10 : 0) + (v.lang === VARIANT[lang] ? 1 : 0)
  }
  const best = [...voices].sort((a, b) => score(b) - score(a))[0]
  return best ? { voice: best, exact: genderOf(best.name) === want } : null
}

/** Reads a sentence aloud (stopping whatever was being read). */
export function speak(text: string, lang: Lang) {
  const picked = pickVoice(voicesOf(lang), lang, gender)
  if (!picked) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = picked.voice
  u.lang = picked.voice.lang
  u.rate = 0.9
  // No voice of the chosen kind: a lower pitch for "male", a higher one for "female".
  if (!picked.exact) u.pitch = gender === 'male' ? 0.75 : 1.2
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

/** True when the device can read in this language. */
export const useCanSpeak = (lang: Lang): boolean => useVoices(lang).length > 0

/** The voice that will read a language for a kind, and whether it is really of that kind (for the parent screen). */
export function useVoiceChoice(lang: Lang, want: VoiceGender) {
  return pickVoice(useVoices(lang), lang, want)
}
