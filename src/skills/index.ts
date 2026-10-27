import type { Lang } from '@/i18n'
import count5 from './count-5.json'
import count10 from './count-10.json'
import oneMore from './one-more.json'
import oneLess from './one-less.json'
import add5 from './add-5.json'
import add10 from './add-10.json'
import take5 from './take-5.json'
import take10 from './take-10.json'
import bigger from './bigger.json'
import firstSound from './first-sound.json'
import aAn from './a-an.json'
import rhyme from './rhyme.json'
import type { Item, SkillDef, SkillText, Subject } from './types'

// Every skill, one JSON file each. The child chooses which one to learn; the home screen groups them by subject
// and orders them by stage (byGroup).

export const SKILLS = [
  count5,
  count10,
  oneMore,
  oneLess,
  add5,
  add10,
  take5,
  take10,
  bigger,
  firstSound,
  aAn,
  rhyme,
] as SkillDef[]

/** The subjects in home-screen order, each with its skills from the easiest stage up. */
export const SUBJECTS: Subject[] = ['numbers', 'words', 'patterns']
export const bySubject = (subject: Subject) => SKILLS.filter((s) => s.subject === subject).sort((a, b) => a.stage - b.stage)

export const skillById = (id: string): SkillDef | undefined => SKILLS.find((s) => s.id === id)

/** The language a skill is taught in: English skills always in English, the others in the app language. */
export const skillLang = (def: SkillDef, lang: Lang): Lang => (def.only === 'en' || !def.text[lang] ? 'en' : lang)

/** The skill's sentences in a language. */
export const skillText = (def: SkillDef, lang: Lang): SkillText => def.text[skillLang(def, lang)] ?? def.text.en

/** Fills {placeholders} from a question's values. Pure (tested). */
export const fill = (template: string, values: Record<string, number | string>) => template.replace(/\{(\w+)\}/g, (all, k: string) => (k in values ? String(values[k]) : all))

/** The question, the reason and the teach sentence of an item, ready to show and read aloud. */
export function itemWords(def: SkillDef, item: Pick<Item, 'values'>, lang: Lang) {
  const t = skillText(def, lang)
  const reason = t.reasons?.[String(item.values.rule)] ?? t.reason
  // A reason can start with the word itself ("cake and snake …"): it still starts with a capital, as a sentence.
  const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return { prompt: fill(t.prompt, item.values), say: fill(t.say ?? t.prompt, item.values), reason: sentence(fill(reason, item.values)), teach: fill(t.teach, item.values) }
}
