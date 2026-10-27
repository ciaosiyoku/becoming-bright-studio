import type { Lang } from '@/i18n'
import type { Item, SkillDef, SkillText, Subject } from './types'

// Every skill, one JSON file each. The child chooses which one to learn; the home screen groups them by subject
// in teaching order (bySubject).

/** Every skill: each JSON file in this folder. */
export const SKILLS: SkillDef[] = Object.values(import.meta.glob<SkillDef>('./*.json', { eager: true, import: 'default' }))

/** The subjects in home-screen order, each with its skills in teaching order. */
export const SUBJECTS: Subject[] = ['numbers', 'words', 'patterns', 'science', 'french']
/** The picture of each subject (the skill chooser). */
export const SUBJECT_EMOJI: Record<Subject, string> = { numbers: 'abacus', words: 'letters', patterns: 'puzzle', science: 'magnet', french: 'speech' }
export const bySubject = (subject: Subject) => SKILLS.filter((s) => s.subject === subject).sort((a, b) => a.order - b.order)

export const skillById = (id: string): SkillDef | undefined => SKILLS.find((s) => s.id === id)

/** The language a skill is taught in: English skills always in English, French skills in French, the others in the app language. */
export const skillLang = (def: SkillDef, lang: Lang): Lang => def.only ?? (def.text[lang] ? lang : 'en')

/** The skill's sentences in a language. */
export const skillText = (def: SkillDef, lang: Lang): SkillText => def.text[skillLang(def, lang)] ?? def.text.en

/** Fills {placeholders} from a question's values. Pure (tested). */
export const fill = (template: string, values: Record<string, number | string>) => template.replace(/\{(\w+)\}/g, (all, k: string) => (k in values ? String(values[k]) : all))

/** The question, the reason and the teach sentence of an item, ready to show and read aloud. */
export function itemWords(def: SkillDef, item: Pick<Item, 'values'>, lang: Lang) {
  const t = skillText(def, lang)
  const rule = String(item.values.rule)
  const reason = t.reasons?.[rule] ?? t.reason
  const prompt = t.prompts?.[rule] ?? t.prompt
  // A reason can start with the word itself ("cake and snake …"): it still starts with a capital, as a sentence.
  const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return { prompt: fill(prompt, item.values), say: fill(t.say ?? prompt, item.values), reason: sentence(fill(reason, item.values)), teach: fill(t.teach, item.values) }
}
