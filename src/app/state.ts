import type { Lang } from '@/i18n'

// The app state: one document, saved on the device under one key (STATE_KEY, see store.tsx). Pure helpers,
// tested in state.test.ts. Adding a field later: give it a default in emptyState/newChild; withDefaults fills
// it in for documents saved before.

export const STATE_KEY = 'state'
export const STATE_VERSION = 1

/** A wrong answer in a check, kept for the parent screen ("today's misses"). */
export interface Miss {
  /** "YYYY-MM-DD" */
  day: string
  skill: string
  prompt: string
  given: string
  answer: string
}

/** How far a child is with one skill. */
export interface SkillProgress {
  /** 4 of 5 checks right once: mastered. */
  mastered: boolean
  /** "YYYY-MM-DD" of the session that mastered it. */
  masteredOn?: string
  /** Sessions finished (teach card, guided tries and five checks). */
  sessions: number
  /** Checks right in the last session (0–5). */
  lastScore: number | null
}

export interface Child {
  id: string
  name: string
  /** The child's colour (buttons, their card on the home screen). */
  colour: string
  skills: Record<string, SkillProgress>
  /** Recent misses, newest last (at most MAX_MISSES). */
  misses: Miss[]
}

export interface AppState {
  version: number
  children: Child[]
  /** The child using the app now. */
  activeChild: string | null
  /** The app language; null = the device language. */
  lang: Lang | null
  /** ms since 1970 of the last backup file, or null. */
  lastBackupAt: number | null
  updatedAt: number
}

export const MAX_MISSES = 300
export const COLOURS = ['#5b6cf0', '#e2557e', '#178c84', '#e08a1e', '#8b5cf6', '#22a06b'] as const

export const emptyState = (): AppState => ({ version: STATE_VERSION, children: [], activeChild: null, lang: null, lastBackupAt: null, updatedAt: 0 })

export function newChild(name: string, colour: string, id: string = crypto.randomUUID()): Child {
  return { id, name: name.trim(), colour, skills: {}, misses: [] }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** A saved document completed with today's defaults (fields added in a later version), children included. Pure. */
export function withDefaults(saved: unknown): AppState {
  const base = emptyState()
  if (!isObject(saved)) return base
  const state = { ...base, ...saved } as AppState
  state.children = Array.isArray(saved.children) ? saved.children.filter(isObject).map((c) => ({ ...newChild('', COLOURS[0], String(c.id ?? crypto.randomUUID())), ...c }) as Child) : []
  if (!state.children.some((c) => c.id === state.activeChild)) state.activeChild = state.children[0]?.id ?? null
  return state
}

/** The child using the app now, or null before setup. */
export const activeChild = (s: AppState): Child | null => s.children.find((c) => c.id === s.activeChild) ?? null

/** Changes one child. Pure. */
export const updateChild = (s: AppState, id: string, change: (c: Child) => Child): AppState => ({ ...s, children: s.children.map((c) => (c.id === id ? change(c) : c)) })

/** "YYYY-MM-DD" in local time. */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
