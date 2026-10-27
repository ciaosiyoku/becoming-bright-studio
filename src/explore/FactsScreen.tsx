import { ArrowRight, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { speak, stopSpeaking, useCanSpeak } from '@/shared/speak'
import { type FactTopic, factOrder, factText } from './facts'
import './Explore.css'

const TOPICS: FactTopic[] = ['space', 'science', 'nature', 'world', 'history']

/** "Did you know?": one true fact at a time, in a new random order each visit; a topic can be chosen. */
export function Facts() {
  const T = useT()
  const lang = useLang()
  const speaks = useCanSpeak(lang)
  const [order] = useState(() => factOrder())
  const [topic, setTopic] = useState<FactTopic | null>(null)
  const [at, setAt] = useState(0)
  const list = order.filter((f) => !topic || f.topic === topic)
  const fact = list[at % list.length]
  const text = factText(fact, lang)
  useEffect(() => stopSpeaking, [text])
  const choose = (t: FactTopic | null) => {
    setTopic(t)
    setAt(0)
  }
  return (
    <div className="explore">
      <div className="library-filter" role="radiogroup">
        <button role="radio" aria-checked={topic === null} className={topic === null ? '' : 'secondary'} onClick={() => choose(null)}>
          {T.facts.all}
        </button>
        {TOPICS.map((t) => (
          <button key={t} role="radio" aria-checked={topic === t} className={topic === t ? '' : 'secondary'} onClick={() => choose(t)}>
            {T.facts.topics[t]}
          </button>
        ))}
      </div>
      <section className="card one-card">
        <Emoji name={fact.emoji} size={120} />
        <p>{text}</p>
        <div className="row">
          {speaks && (
            <button className="secondary" onClick={() => speak(text, lang)}>
              <Volume2 /> {T.lesson.hear}
            </button>
          )}
          <button className="big" onClick={() => setAt(at + 1)}>
            {T.facts.another} <ArrowRight />
          </button>
        </div>
      </section>
    </div>
  )
}
