import { useStore } from '@/app/store'
import { LANGS, useLang } from '@/i18n'

/** The app language: each language named in itself. Saved for the family (state.lang). */
export function LanguagePicker() {
  const lang = useLang()
  const { update } = useStore()
  return (
    <div className="row center" role="radiogroup">
      {LANGS.map((l) => (
        <button key={l.id} role="radio" aria-checked={lang === l.id} lang={l.id} className={lang === l.id ? '' : 'secondary'} onClick={() => update((s) => ({ ...s, lang: l.id }))}>
          {l.name}
        </button>
      ))}
    </div>
  )
}
