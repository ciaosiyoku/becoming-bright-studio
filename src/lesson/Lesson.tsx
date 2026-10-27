import { ArrowLeft } from 'lucide-react'
import { useT } from '@/i18n'

/** One skill: teach card, two guided tries, five checks (comes next). */
export function Lesson({ skill, onClose }: { skill: string; onClose: () => void }) {
  const T = useT()
  return (
    <main className="home">
      <button className="secondary" onClick={onClose}>
        <ArrowLeft /> {T.common.back}
      </button>
      <section className="card">
        <h2>{skill}</h2>
      </section>
    </main>
  )
}
