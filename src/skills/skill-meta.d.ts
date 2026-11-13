// The skills without their questions, made at build time from src/skills/*.json by the skillMeta plugin in
// vite.config.ts (each file's fields except "params").
declare module 'virtual:skill-meta' {
  const skills: import('@/skills/types').SkillMeta[]
  export default skills
}
