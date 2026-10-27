import { useStore } from '@/app/store'
import { de } from './de'
import { en, type Strings } from './en'
import { fr } from './fr'
import { yo } from './yo'

// The app's languages and the useT() hook. The language is a parent setting (state.lang); until it is set, the
// device language decides.

export type { Strings }
export type Lang = 'en' | 'de' | 'fr' | 'yo'

/** The languages, each named in itself (the language picker). */
export const LANGS: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'de', name: 'Deutsch' },
  { id: 'fr', name: 'Français' },
  { id: 'yo', name: 'Yorùbá' },
]
const STRINGS: Record<Lang, Strings> = { en, de, fr, yo }

/** The app language that matches the device (English when there is none of ours). Pure (tested). */
export function deviceLang(language = globalThis.navigator?.language ?? 'en'): Lang {
  const l = language.toLowerCase()
  return LANGS.find((x) => l.startsWith(x.id))?.id ?? 'en'
}

/** The sentences of a language (pages without the app's state, such as the install page). */
export const stringsFor = (lang: Lang): Strings => STRINGS[lang]

/** The language in use. */
export function useLang(): Lang {
  const { state } = useStore()
  return state.lang ?? deviceLang()
}

/** The sentences in the language in use. */
export const useT = (): Strings => STRINGS[useLang()]
