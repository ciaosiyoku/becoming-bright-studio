import { useEffect, useState } from 'react'
import { loadSkill } from './index'
import type { SkillDef } from './types'

/**
 * Full skills (with their questions) for a lesson or a game, loaded when it opens (index.ts: loadSkill). null while
 * loading (a moment at most: the files are small and saved on the device), "error" when they could not be loaded
 * (offline before they were ever saved).
 */
export function useSkills(ids: readonly string[]): SkillDef[] | 'error' | null {
  const key = ids.join(' ')
  const [result, setResult] = useState<{ key: string; value: SkillDef[] | 'error' } | null>(null)
  useEffect(() => {
    let live = true
    Promise.all(key ? key.split(' ').map(loadSkill) : []).then(
      (defs) => {
        if (live) setResult({ key, value: defs })
      },
      () => {
        if (live) setResult({ key, value: 'error' })
      },
    )
    return () => {
      live = false
    }
  }, [key])
  return result?.key === key ? result.value : null
}
