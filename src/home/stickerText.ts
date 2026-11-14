import type { StickerRule } from '@/app/stickers'
import type { Strings } from '@/i18n'

/** How a sticker is earned, in the app's language ("First Maths tree"). */
export function stickerText(T: Strings, rule: StickerRule): string {
  const t = T.home.stickerRule
  switch (rule.kind) {
    case 'first':
      return t.first
    case 'firstOf':
      return t.firstOf(T.home.subjects[rule.subject])
    case 'trees':
      return t.trees(rule.n)
    case 'subjectTrees':
      return t.subjectTrees(rule.n, T.home.subjects[rule.subject])
    case 'perfect':
      return t.perfect
    case 'days':
      return t.days(rule.n)
    case 'lessons':
      return t.lessons(rule.n)
    case 'learningDays':
      return t.learningDays(rule.n)
    case 'stars':
      return t.stars(rule.n)
    case 'perfectCount':
      return t.perfectCount(rule.n)
    case 'perfectIn':
      return t.perfectIn(T.home.subjects[rule.subject])
    case 'allOf':
      return t.allOf(T.home.subjects[rule.subject])
  }
}
