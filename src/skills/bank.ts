import type { Lang } from '@/i18n'
import type { Calc } from './numbers'
import { int, withAnswer } from './random'
import type { SkillDef } from './types'

// Question banks: the science, French and extra English skills. Each skill's JSON holds its questions in every
// language it is taught in (params.bank), the same questions in the same order in each, so one picked question
// can be shown in any of them. A question is [question, right answer, wrong answer, wrong answer, reason], with an
// optional picture (params.emojis, same order). The wrong answers are written by hand, so there is exactly one
// right answer (content.test.ts checks this in every language).
//
// The words are made per language when picked ({q_en}, {q_fr} …): each language's prompt is "{q_<lang>}" and its
// reason "{why_<lang>}", so the usual sentence filling (itemWords) works unchanged.

export type BankKind = 'bank'
export type BankQuestion = [question: string, answer: string, wrong1: string, wrong2: string, why: string]

export const bankOf = (def: SkillDef, lang: Lang): BankQuestion[] => {
  const bank = def.params.bank as Partial<Record<Lang, BankQuestion[]>>
  return bank[lang] ?? bank[def.only ?? 'en'] ?? bank.en!
}

/** The values of question i: its words in every language of the bank. */
export function bankValues(def: SkillDef, i: number): Record<string, number | string> {
  const bank = def.params.bank as Partial<Record<Lang, BankQuestion[]>>
  const values: Record<string, number | string> = { i }
  for (const [lang, qs] of Object.entries(bank)) {
    values[`q_${lang}`] = qs[i][0]
    values[`answer_${lang}`] = qs[i][1]
    values[`why_${lang}`] = qs[i][4]
  }
  return values
}

export const BANK_CALC: Record<BankKind, Calc> = {
  bank: {
    pick: (def, r) => bankValues(def, int(r, 0, bankOf(def, def.only ?? 'en').length - 1)),
    build: (def, v, r, lang) => {
      const [, answer, w1, w2] = bankOf(def, lang)[Number(v.i)]
      const emoji = (def.params.emojis as string[] | undefined)?.[Number(v.i)]
      return { visual: emoji ? { kind: 'picture', emoji } : undefined, ...withAnswer(r, { label: answer }, [{ label: w1 }, { label: w2 }]) }
    },
  },
}
