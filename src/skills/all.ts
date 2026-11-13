import type { SkillDef } from './types'

// Every full skill at once, questions included. For the tests only: the app loads each skill when it is needed
// (index.ts: loadSkill), so the question banks are not part of the first download.

export const ALL_SKILLS: SkillDef[] = Object.values(import.meta.glob<SkillDef>('./*.json', { eager: true, import: 'default' }))
