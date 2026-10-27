import { Mail } from 'lucide-react'
import { useState } from 'react'
import type { Child } from '@/app/state'
import { useLang, useT } from '@/i18n'
import { skillById, SKILLS, skillText } from '@/skills/index'
import { useToday } from '@/shared/useToday'
import { AREAS, duration, makeReport, type Period } from './report'

const PERIODS: Period[] = ['day', 'week', 'month']

/** A child's learning report for today, the last 7 or the last 30 days, with the questions to practise again. */
export function ReportCard({ child }: { child: Child }) {
  const T = useT()
  const lang = useLang()
  const today = useToday()
  const [period, setPeriod] = useState<Period>('day')
  const r = makeReport(child, period, new Date(`${today}T12:00:00`))
  const title = (id: string) => {
    const def = skillById(id)
    return def ? skillText(def, lang).title : id
  }
  const name = child.name || '—'
  const stats: [string, string][] = [
    [T.parent.lessons, String(r.lessons)],
    [T.parent.passed, String(r.passed)],
    [T.parent.accuracy, r.accuracy === null ? '—' : `${r.accuracy} %`],
    [T.parent.activeDays, period === 'day' ? (r.activeDays ? '✓' : '—') : `${r.activeDays} / ${r.days.length}`],
  ]
  const learntAll = SKILLS.filter((s) => child.skills[s.id]?.mastered).length
  const misses = r.misses.slice(-20).reverse()
  const text = [
    T.parent.reportTitle(name),
    T.parent.periods[period],
    '',
    ...stats.map(([k, v]) => `${k}: ${v}`),
    `${T.parent.learntNew}: ${r.learnt.length ? r.learnt.map(title).join(', ') : '—'}`,
    T.parent.learnt(learntAll, SKILLS.length),
    '',
    `${T.parent.timeTitle}:`,
    ...AREAS.map((a) => `  ${T.parent.areas[a]}: ${duration(r.time[a])}`),
    ...(misses.length ? ['', `${T.parent.missesIn}:`, ...misses.map((m) => `  ${m.prompt} → ${m.answer} (${m.given})`)] : []),
  ].join('\n')
  const mailto = `mailto:?subject=${encodeURIComponent(T.parent.emailSubject(name, T.parent.periods[period]))}&body=${encodeURIComponent(text)}`
  return (
    <section className="card parent-card report">
      <h2>{T.parent.reportTitle(name)}</h2>
      <p className="muted">{T.parent.reportNote}</p>
      <div className="report-periods" role="radiogroup">
        {PERIODS.map((p) => (
          <button key={p} role="radio" aria-checked={p === period} className={p === period ? '' : 'secondary'} onClick={() => setPeriod(p)}>
            {T.parent.periods[p]}
          </button>
        ))}
      </div>
      <dl className="report-stats">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <h3>{T.parent.learntNew}</h3>
      <p>{r.learnt.length ? r.learnt.map(title).join(' · ') : T.parent.noActivity}</p>
      <p className="pill">{T.parent.learnt(learntAll, SKILLS.length)}</p>
      <h3>{T.parent.timeTitle}</h3>
      <ul className="report-time">
        {AREAS.map((a) => (
          <li key={a}>
            <span>{T.parent.areas[a]}</span> <b>{duration(r.time[a])}</b>
          </li>
        ))}
      </ul>
      <h3>{T.parent.missesIn}</h3>
      {misses.length === 0 ? (
        <p>{T.parent.missesNone}</p>
      ) : (
        <table className="misses">
          <thead>
            <tr>
              <th>{T.parent.question}</th>
              <th>{T.parent.answered}</th>
              <th>{T.parent.rightAnswer}</th>
            </tr>
          </thead>
          <tbody>
            {misses.map((m, i) => (
              <tr key={i}>
                <td>
                  {m.prompt}
                  <small className="muted"> · {title(m.skill)}</small>
                </td>
                <td className="given">{m.given}</td>
                <td className="answer">{m.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <a className="button secondary report-mail" href={mailto}>
        <Mail /> {T.parent.email}
      </a>
    </section>
  )
}
