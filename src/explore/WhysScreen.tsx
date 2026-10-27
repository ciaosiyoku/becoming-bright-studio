import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLang, useT } from '@/i18n'
import { Emoji } from '@/shared/Emoji'
import { speak, stopSpeaking, useCanSpeak } from '@/shared/speak'
import { WHY_TOPICS, WHYS } from './whys'
import type { Why, WhyTopic } from './whys/types'
import './Explore.css'

/** 100 Whys: the child picks a question about something around them, thinks, then finds out why. */
export function Whys() {
  const T = useT()
  const lang = useLang()
  const [topic, setTopic] = useState<WhyTopic | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const list = WHYS.filter((w) => !topic || w.topic === topic)
  if (open !== null && list[open]) return <WhyCard key={list[open].id} why={list[open]} onBack={() => setOpen(null)} onNext={() => setOpen((open + 1) % list.length)} />
  return (
    <div className="explore">
      <div className="library-filter" role="radiogroup">
        <button role="radio" aria-checked={topic === null} className={topic === null ? '' : 'secondary'} onClick={() => setTopic(null)}>
          {T.whys.all} ({WHYS.length})
        </button>
        {WHY_TOPICS.map((t) => (
          <button key={t} role="radio" aria-checked={topic === t} className={topic === t ? '' : 'secondary'} onClick={() => setTopic(t)}>
            {T.whys.topics[t]}
          </button>
        ))}
      </div>
      <div className="why-list">
        {list.map((w, i) => (
          <button key={w.id} className="card" onClick={() => setOpen(i)}>
            <Emoji name={w.emoji} size={40} /> {w[lang][0]}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A question first (read aloud), time to think, then the answer on a tap. */
function WhyCard({ why, onBack, onNext }: { why: Why; onBack: () => void; onNext: () => void }) {
  const T = useT()
  const lang = useLang()
  const speaks = useCanSpeak(lang)
  const [open, setOpen] = useState(false)
  const [question, answer] = why[lang]
  useEffect(() => {
    speak(question, lang)
    return stopSpeaking
  }, [question, lang])
  const show = () => {
    setOpen(true)
    speak(answer, lang)
  }
  return (
    <div className="explore">
      <section className="card one-card">
        <Emoji name={why.emoji} size={120} />
        <h2>{question}</h2>
        {open ? (
          <p>{answer}</p>
        ) : (
          <button className="big" onClick={show}>
            {T.whys.answer}
          </button>
        )}
        <div className="row">
          <button className="secondary" onClick={onBack} aria-label={T.common.back}>
            <ArrowLeft />
          </button>
          {speaks && (
            <button className="secondary" onClick={() => speak(open ? `${question} ${answer}` : question, lang)}>
              <Volume2 /> {T.lesson.hear}
            </button>
          )}
          <button className={open ? 'big' : 'secondary'} onClick={onNext}>
            {T.whys.another} <ArrowRight />
          </button>
        </div>
      </section>
    </div>
  )
}
