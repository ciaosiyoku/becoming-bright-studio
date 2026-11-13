import skillMeta from 'virtual:skill-meta'
import type { Lang } from '@/i18n'
import type { Item, SkillDef, SkillMeta, SkillText, Subject } from './types'

// Every skill, one JSON file each. The child chooses which one to learn; the home screen groups them by subject
// in teaching order (bySubject).
//
// Speed: the JSON files hold about 2.5 MB of questions (mostly the science, French and English question banks, in
// every language). The app starts with only each skill's id, subject, ages, picture and words ("virtual:skill-meta",
// made from the same files by the skillMeta plugin in vite.config.ts). A lesson or a game loads the full skill when
// it opens (loadSkill, or useSkills in useSkills.ts); each skill is its own small file, saved for offline use
// (shared/offline.ts). Tests use every full skill at once (all.ts).

/** Every skill, without its questions (SkillMeta): each JSON file in this folder. */
export const SKILLS: SkillMeta[] = skillMeta

/** The full skill files, each loaded when first needed. */
const FULL = import.meta.glob<SkillDef>('./*.json', { import: 'default' })
const loading = new Map<string, Promise<SkillDef>>()

/** The full skill (with its question maker's settings). Loaded once; a failed load (offline) is tried again next time. */
export function loadSkill(id: string): Promise<SkillDef> {
  const known = loading.get(id)
  if (known) return known
  const load = FULL[`./${id}.json`]
  if (!load) return Promise.reject(new Error(`No skill ${id}`))
  const promise = load()
  loading.set(id, promise)
  promise.catch(() => loading.delete(id))
  return promise
}

/** The subjects in home-screen order, each with its skills in teaching order. */
export const SUBJECTS: Subject[] = ['numbers', 'words', 'patterns', 'science', 'french']
/** The picture of each subject (the skill chooser). */
export const SUBJECT_EMOJI: Record<Subject, string> = { numbers: 'abacus', words: 'letters', patterns: 'puzzle', science: 'magnet', french: 'speech' }
export const bySubject = (subject: Subject) => SKILLS.filter((s) => s.subject === subject).sort((a, b) => a.order - b.order)

export const skillById = (id: string): SkillMeta | undefined => SKILLS.find((s) => s.id === id)

/** The language a skill is taught in: English skills always in English, French skills in French, the others in the app language. */
export const skillLang = (def: SkillMeta, lang: Lang): Lang => def.only ?? (def.text[lang] ? lang : 'en')

/** The skill's sentences in a language. */
export const skillText = (def: SkillMeta, lang: Lang): SkillText => def.text[skillLang(def, lang)] ?? def.text.en

/** Fills {placeholders} from a question's values. Pure (tested). */
export const fill = (template: string, values: Record<string, number | string>) => template.replace(/\{(\w+)\}/g, (all, k: string) => (k in values ? String(values[k]) : all))

/** The question, the reason and the teach sentence of an item, ready to show and read aloud. */
export function itemWords(def: SkillMeta, item: Pick<Item, 'values'>, lang: Lang) {
  const t = skillText(def, lang)
  const rule = String(item.values.rule)
  const reason = t.reasons?.[rule] ?? t.reason
  const prompt = t.prompts?.[rule] ?? t.prompt
  // A reason can start with the word itself ("cake and snake …"): it still starts with a capital, as a sentence.
  const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return { prompt: fill(prompt, item.values), say: fill(t.say ?? prompt, item.values), reason: sentence(fill(reason, item.values)), teach: fill(t.teach, item.values) }
}
