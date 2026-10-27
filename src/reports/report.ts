import { SUBJECTS, type Subject } from '@/access/catalogue'
import type { Mistake, Progress, Score, Settings, Usage } from '@/data/types'
import type { Strings } from '@/i18n'
import type { Lang } from '@/i18n'
import { LADDERS, stageTags } from '@/lessons/ladder'
import { skillName } from '@/lessons/text'
import { reviewCounts } from '@/lessons/review'
import { levelOf } from '@/progress/progress'
import { computeStreak } from '@/progress/streak'
import { areaKind } from '@/progress/usage'
import { addDays, isoDate, mondayOf } from '@/shared/date'

// Reports for parents: a day, a week (Monday–Sunday) or a month, built from what is saved on the device.
// Sent by email through the parent's own mail app (a mailto: link), so nothing goes through a server.
// Pure functions (tested in report.test.ts).

export type Period = Settings['report']['period']

export interface SubjectReport {
  subject: Subject
  missions: number
  /** Share right at the first try over the period's best daily scores (0-1), or null without results. */
  accuracy: number | null
  /** The skill being practised now. */
  skill: string
  stage: string
}

/** A skill the child got wrong often in the period, with examples of their wrong answers. */
export interface HelpItem {
  subject: Subject
  step: string
  skill: string
  stage: string
  right: number
  total: number
  examples: Mistake[]
}

/** How well a skill is known, from its answers over the last MASTERY_DAYS days. */
export type Mastery = 'known' | 'practising' | 'needsHelp'

/** A skill practised in the last MASTERY_DAYS days, with how well it is known. */
export interface SkillReport {
  subject: Subject
  step: string
  skill: string
  stage: string
  right: number
  total: number
  /** Questions of this skill waiting in the review boxes. */
  inReview: number
  mastery: Mastery
}

/** Skills are judged over this many days up to the end of the period, so a short period still has enough answers. */
export const MASTERY_DAYS = 30
/** Known: at least KNOWN_MIN_TRIES answers, KNOWN_FROM of them right, and at most 1 question of it left to review. */
export const KNOWN_FROM = 0.85
export const KNOWN_MIN_TRIES = 8

/** How well a skill is known. Pure (tested). */
export function masteryOf(s: Score, inReview: number): Mastery {
  if (s.total >= HELP_MIN_TRIES && s.right / s.total < HELP_BELOW) return 'needsHelp'
  if (s.total >= KNOWN_MIN_TRIES && s.right / s.total >= KNOWN_FROM && inReview <= 1) return 'known'
  return 'practising'
}

/** Skills answered right less often than this, with at least HELP_MIN_TRIES tries, show as "needs help". */
export const HELP_BELOW = 0.7
export const HELP_MIN_TRIES = 4

/** The subject and ladder step of a step id, or null for an unknown id. */
function findStep(id: string): { subject: Subject; skill: string; stage: number } | null {
  for (const subject of SUBJECTS) {
    const s = LADDERS[subject].find((x) => x.id === id)
    if (s) return { subject, skill: s.skill, stage: s.stage }
  }
  return null
}

export interface Report {
  period: Period
  from: string
  to: string
  activeDays: number
  stars: number
  missions: number
  minutes: { learning: number; games: number; other: number; earnedUsed: number }
  subjects: SubjectReport[]
  /** The learning streak now and the longest so far (days in a row). */
  streak: { current: number; longest: number }
  /** Weakest skills first. */
  needsHelp: HelpItem[]
  /** Wrong answers in the period, newest first (at most 10). */
  mistakes: Mistake[]
  /** Every skill practised in the last MASTERY_DAYS days up to the period's end, by subject in ladder order. */
  skills: SkillReport[]
  /** The review boxes now (questions to practise again, due now), and questions learnt from them in the period. */
  review: { waiting: number; due: number; mastered: number }
}

/** First and last day of the period containing `now` (week: Monday–Sunday). */
export function periodRange(period: Period, now: Date): { from: Date; to: Date } {
  if (period === 'day') return { from: now, to: now }
  if (period === 'week') {
    const from = mondayOf(now)
    return { from, to: addDays(from, 6) }
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
}

export function buildReport(progress: Progress, usage: Usage, period: Period, now: Date, stage: number, lang: Lang = 'en'): Report {
  const { from, to } = periodRange(period, now)
  const first = isoDate(from)
  const last = isoDate(to)
  const inRange = (day: string) => day >= first && day <= last
  const sum = (rec: Record<string, number>) => Object.entries(rec).reduce((n, [day, v]) => (inRange(day) ? n + v : n), 0)

  const seconds = { learning: 0, games: 0, other: 0 }
  const active = new Set<string>()
  for (const [day, areas] of Object.entries(usage.days)) {
    if (!inRange(day)) continue
    for (const [area, s] of Object.entries(areas)) {
      const kind = areaKind(area)
      if (kind === 'mission') seconds.learning += s
      else if (kind === 'game') seconds.games += s
      else seconds.other += s
      if (s > 0) active.add(day)
    }
  }
  for (const [day, n] of Object.entries(progress.stars)) if (inRange(day) && n > 0) active.add(day)

  const subjects = SUBJECTS.map((subject): SubjectReport => {
    let missions = 0
    let right = 0
    let total = 0
    for (const [day, done] of Object.entries(progress.missions)) if (inRange(day) && done.includes(subject)) missions++
    for (const [day, scores] of Object.entries(progress.scores)) {
      const s = inRange(day) ? scores[subject] : undefined
      if (s) {
        right += s.right
        total += s.total
      }
    }
    const step = LADDERS[subject][Math.min(levelOf(progress, subject, stage), LADDERS[subject].length - 1)]
    return { subject, missions, accuracy: total > 0 ? right / total : null, skill: skillName(step, lang), stage: stageTags(step.stage).cambridge }
  })

  // Skills that need help: answers per step over the period.
  const perStep = new Map<string, Score>()
  for (const [day, steps] of Object.entries(progress.attempts)) {
    if (!inRange(day)) continue
    for (const [step, s] of Object.entries(steps)) {
      const sum = perStep.get(step) ?? { right: 0, total: 0 }
      perStep.set(step, { right: sum.right + s.right, total: sum.total + s.total })
    }
  }
  const mistakes = progress.mistakes.filter((m) => inRange(m.day)).reverse()
  const needsHelp: HelpItem[] = []
  for (const [step, s] of perStep) {
    const info = findStep(step)
    if (!info || s.total < HELP_MIN_TRIES || s.right / s.total >= HELP_BELOW) continue
    needsHelp.push({ subject: info.subject, step, skill: skillName({ id: step, skill: info.skill }, lang), stage: stageTags(info.stage).cambridge, ...s, examples: mistakes.filter((m) => m.step === step).slice(0, 3) })
  }
  needsHelp.sort((a, b) => a.right / a.total - b.right / b.total)

  // How well each skill is known: answers over the last MASTERY_DAYS days up to the period's end (or today).
  const end = last < isoDate(now) ? last : isoDate(now)
  const masteryFrom = isoDate(addDays(new Date(`${end}T12:00:00`), -(MASTERY_DAYS - 1)))
  const recentPerStep = new Map<string, Score>()
  for (const [day, steps] of Object.entries(progress.attempts)) {
    if (day < masteryFrom || day > end) continue
    for (const [step, s] of Object.entries(steps)) {
      const sum = recentPerStep.get(step) ?? { right: 0, total: 0 }
      recentPerStep.set(step, { right: sum.right + s.right, total: sum.total + s.total })
    }
  }
  const inReview = new Map<string, number>()
  for (const item of progress.review) {
    const step = item.question.step ?? ''
    inReview.set(step, (inReview.get(step) ?? 0) + 1)
  }
  const skills: SkillReport[] = SUBJECTS.flatMap((subject) =>
    LADDERS[subject].flatMap((step) => {
      const s = recentPerStep.get(step.id)
      if (!s) return []
      const waiting = inReview.get(step.id) ?? 0
      return [{ subject, step: step.id, skill: skillName(step, lang), stage: stageTags(step.stage).cambridge, ...s, inReview: waiting, mastery: masteryOf(s, waiting) }]
    }),
  )
  const boxes = reviewCounts(progress.review, isoDate(now))

  const minutes = (s: number) => Math.round(s / 60)
  return {
    period,
    from: first,
    to: last,
    activeDays: active.size,
    stars: sum(progress.stars),
    missions: Object.entries(progress.missions).reduce((n, [day, done]) => (inRange(day) ? n + done.length : n), 0),
    minutes: { learning: minutes(seconds.learning), games: minutes(seconds.games), other: minutes(seconds.other), earnedUsed: minutes(sum(usage.earnedUsed)) },
    subjects,
    streak: (({ current, longest }) => ({ current, longest }))(computeStreak(progress.stars, now)),
    needsHelp,
    mistakes: mistakes.slice(0, 10),
    skills,
    review: { ...boxes, mastered: sum(progress.mastered) },
  }
}

/** The report as plain text for an email. */
export function reportText(r: Report, t: Strings, childName: string): string {
  const lines = [
    t.reports.emailTitle(childName, t.reports.periods[r.period], r.from === r.to ? r.from : `${r.from} – ${r.to}`),
    '',
    t.reports.activeDays(r.activeDays),
    t.reports.starsLine(r.stars, r.missions),
    t.reports.streakLine(r.streak.current, r.streak.longest),
    t.reports.minutesLine(r.minutes.learning, r.minutes.games, r.minutes.earnedUsed),
    '',
    t.reports.bySubject,
    ...r.subjects.map((s) => `- ${t.items[s.subject]}: ${t.reports.subjectLine(s.missions, s.accuracy === null ? null : Math.round(s.accuracy * 100), s.skill, s.stage)}`),
    '',
    r.needsHelp.length === 0 ? t.reports.noHelpNeeded : t.reports.needsHelp,
    ...r.needsHelp.flatMap((h) => [
      `- ${t.items[h.subject]}: ${h.skill} (${t.reports.rightOf(h.right, h.total)})`,
      ...h.examples.map((m) => `    ${t.reports.mistakeLine(m.prompt, m.given, m.answer)}`),
    ]),
    '',
    t.reports.reviewLine(r.review.waiting, r.review.due, r.review.mastered),
    ...(r.skills.length > 0 ? ['', t.reports.skillsHeading(MASTERY_DAYS), ...r.skills.map((s) => `- ${t.items[s.subject]}: ${s.skill} – ${t.reports.mastery[s.mastery]} (${t.reports.rightOf(s.right, s.total)})`)] : []),
    '',
    t.reports.footer,
  ]
  return lines.join('\n')
}

/** A mailto: link that opens the parent's own mail app with the report filled in. */
export function mailtoUrl(to: string, subject: string, body: string): string {
  // The @ stays as it is: some mail apps do not decode %40 in the address.
  return `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
