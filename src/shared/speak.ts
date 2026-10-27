import { useEffect, useState } from 'react'
import type { Lang } from '@/i18n'

// Reading aloud with the device's own voices (Web Speech API). Nothing is sent anywhere by the app. A device without
// a voice for the language shows the words only (the speaker buttons hide). One thing is read at a time.

const VARIANT: Record<Lang, string> = { en: 'en-GB' }

function voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in globalThis)) return undefined
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang))
  // The device's own voices first (private, and they work offline), then the usual regional variant.
  return voices.sort((a, b) => Number(b.localService) - Number(a.localService) || Number(b.lang === VARIANT[lang]) - Number(a.lang === VARIANT[lang]))[0]
}

/** Reads a sentence aloud (stopping whatever was being read). */
export function speak(text: string, lang: Lang) {
  const voice = voiceFor(lang)
  if (!voice) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = 0.9
  speechSynthesis.speak(u)
}

export const stopSpeaking = () => {
  if ('speechSynthesis' in globalThis) speechSynthesis.cancel()
}

/** True (and updated when the voices arrive) when the device can read in this language. */
export function useCanSpeak(lang: Lang): boolean {
  const [can, setCan] = useState(() => Boolean(voiceFor(lang)))
  useEffect(() => {
    if (!('speechSynthesis' in globalThis)) return
    const update = () => setCan(Boolean(voiceFor(lang)))
    update()
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [lang])
  return can
}
