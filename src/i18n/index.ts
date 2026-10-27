import { useStore } from '@/app/store'
import { en, type Strings } from './en'

// The app's languages and the useT() hook. The language is a parent setting (state.lang); until it is set, the
// device language decides.

export type { Strings }
export type Lang = 'en'

/** The languages, each named in itself (the language picker). */
export const LANGS: { id: Lang; name: string }[] = [{ id: 'en', name: 'English' }]
const STRINGS: Record<Lang, Strings> = { en }

/** The app language that matches the device (English when there is none of ours). Pure (tested). */
export function deviceLang(language = globalThis.navigator?.language ?? 'en'): Lang {
  const l = language.toLowerCase()
  return LANGS.find((x) => l.startsWith(x.id))?.id ?? 'en'
}

/** The language in use. */
export function useLang(): Lang {
  const { state } = useStore()
  return state.lang ?? deviceLang()
}

/** The sentences in the language in use. */
export const useT = (): Strings => STRINGS[useLang()]
