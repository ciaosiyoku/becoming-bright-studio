import type { Lang } from '@/i18n'
import add5 from './add-5.json'
import type { Item, SkillDef, SkillText } from './types'

// The skills in teaching order: each opens when the one before is mastered. One JSON file per skill.

export const SKILLS: SkillDef[] = [add5 as SkillDef]

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
  return { prompt: fill(t.prompt, item.values), reason: fill(t.reason, item.values), teach: fill(t.teach, item.values) }
}
