import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLang, useT } from '@/i18n'
import { speak, stopSpeaking, useCanSpeak } from '@/shared/speak'
import CREDITS from './photo-credits.json'
import { PLACE_COUNTRIES, PLACES, type Place, placeCountry, placeCountryName, placePhoto } from './places'
import './Explore.css'

// Places of the world: famous buildings and natural wonders with a real photo (Wikimedia Commons, free
// licences), the country, a few true sentences that can be read aloud, and the photo's credit.

const credits = CREDITS as Record<string, { author: string; licence: string }>

export function Places() {
  const T = useT()
  const lang = useLang()
  const [country, setCountry] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  // Another place, back to the grid, or leaving stops what was being read.
  useEffect(() => stopSpeaking, [open])
  const list = PLACES.filter((p) => !country || p.countries.includes(country)).sort((a, b) => a.text[lang].name.localeCompare(b.text[lang].name, lang))
  const countries = Object.keys(PLACE_COUNTRIES)
    .filter((c) => PLACES.some((p) => p.countries.includes(c)))
    .sort((a, b) => placeCountryName(a, lang).localeCompare(placeCountryName(b, lang), lang))
  if (open !== null && list[open])
    return (
      <Detail
        place={list[open]}
        onGrid={() => setOpen(null)}
        onPrev={() => setOpen((open + list.length - 1) % list.length)}
        onNext={() => setOpen((open + 1) % list.length)}
      />
    )
  return (
    <div className="library-body">
      <div className="library-filter" role="radiogroup" aria-label={T.library.countryFilter}>
        <button role="radio" aria-checked={country === null} className={country === null ? '' : 'secondary'} onClick={() => setCountry(null)}>
          {T.library.allCountries}
        </button>
        {countries.map((c) => (
          <button key={c} role="radio" aria-checked={country === c} className={country === c ? '' : 'secondary'} onClick={() => setCountry(c)}>
            {placeCountryName(c, lang)}
          </button>
        ))}
      </div>
      <div className="library-grid">
        {list.map((p, i) => (
          <button key={p.id} className="card library-card" onClick={() => setOpen(i)}>
            <img src={`${import.meta.env.BASE_URL}${placePhoto(p.id)}`} alt="" loading="lazy" />
            <b>{p.text[lang].name}</b>
            <small>{placeCountry(p, lang)}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

function Detail({ place, onGrid, onPrev, onNext }: { place: Place; onGrid: () => void; onPrev: () => void; onNext: () => void }) {
  const T = useT()
  const lang = useLang()
  const speaks = useCanSpeak(lang)
  const credit = credits[place.id]
  const { name, about } = place.text[lang]
  const spoken = `${name}. ${T.library.country} ${placeCountry(place, lang)}. ${about}`
  return (
    <section className="card library-detail">
      <figure>
        <img src={`${import.meta.env.BASE_URL}${placePhoto(place.id)}`} alt={name} />
        {credit && <figcaption>{T.library.photo(credit.author, credit.licence)}</figcaption>}
      </figure>
      <div className="library-text">
        <h2>
          {name}
          {speaks && (
            <button className="secondary" onClick={() => speak(spoken, lang)} aria-label={T.lesson.hear}>
              <Volume2 />
            </button>
          )}
        </h2>
        <p>
          <b>{T.library.country} </b>
          {placeCountry(place, lang)}
        </p>
        <p>{about}</p>
        <div className="library-nav">
          <button className="secondary" onClick={onPrev} aria-label={T.library.previous}>
            <ChevronLeft />
          </button>
          <button className="secondary" onClick={onGrid}>
            {T.library.allCountries}
          </button>
          <button className="secondary" onClick={onNext} aria-label={T.library.next}>
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  )
}
