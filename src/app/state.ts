import type { Lang } from '@/i18n'
import type { PinHash } from '@/parent/pin'
import type { VoiceGender } from '@/shared/speak'
import { type Access, defaultAccess, type ItemId } from './items'

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
  /** The skill the child chose to learn (the Learn tab shows only this one). */
  current: string | null
  /** Lessons passed (4 of 5 checks) per day ("YYYY-MM-DD" → count): they earn time (app/access.ts). */
  passes: Record<string, number>
  /** Earned time used per day, in seconds. */
  earnedUsed: Record<string, number>
  /** Seconds spent per day and area ("YYYY-MM-DD" → lessons / games / media / explore): for the reports. */
  usage: Record<string, Record<string, number>>
}

/** The areas whose time the reports count. */
export type Area = 'lessons' | 'games' | 'media' | 'explore'

/** Family-level settings: one PIN for the whole family, whichever child is using the app. */
export interface Family {
  /** The parent PIN, stored only as a salted hash (parent/pin.ts). null until it is chosen. */
  pin: PinHash | null
  /** The recovery code for a forgotten PIN, stored only as a hash. */
  recovery: PinHash | null
  /** Wrong PIN tries and the wait they started (parent/pin.ts). */
  pinLock: { wrong: number; until: number }
  /** Each game, radio, story, video and explore item: off, open, or "earn first" (app/items.ts). */
  access: Record<ItemId, Access>
  /** Earned time: minutes per passed lesson, and the most a day. */
  rewards: { minutesPerLesson: number; maxPerDay: number }
  /** Reading aloud with a female or a male voice (shared/speak.ts). */
  voice: VoiceGender
}

export interface AppState {
  version: number
  family: Family
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

export const emptyFamily = (): Family => ({ pin: null, recovery: null, pinLock: { wrong: 0, until: 0 }, access: defaultAccess(), rewards: { minutesPerLesson: 10, maxPerDay: 45 }, voice: 'female' })

export const emptyState = (): AppState => ({ version: STATE_VERSION, family: emptyFamily(), children: [], activeChild: null, lang: null, lastBackupAt: null, updatedAt: 0 })

export function newChild(name: string, colour: string, id: string = crypto.randomUUID()): Child {
  return { id, name: name.trim(), colour, skills: {}, misses: [], current: null, passes: {}, earnedUsed: {}, usage: {} }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** A saved document completed with today's defaults (fields added in a later version), children included. Pure. */
export function withDefaults(saved: unknown): AppState {
  const base = emptyState()
  if (!isObject(saved)) return base
  const state = { ...base, ...saved } as AppState
  const savedFamily = isObject(saved.family) ? saved.family : {}
  state.family = { ...emptyFamily(), ...savedFamily, access: { ...defaultAccess(), ...(isObject(savedFamily.access) ? savedFamily.access : {}) } }
  state.children = Array.isArray(saved.children) ? saved.children.filter(isObject).map((c) => ({ ...newChild('', COLOURS[0], String(c.id ?? crypto.randomUUID())), ...c }) as Child) : []
  if (!state.children.some((c) => c.id === state.activeChild)) state.activeChild = state.children[0]?.id ?? null
  return state
}

/** The child using the app now, or null before setup. */
export const activeChild = (s: AppState): Child | null => s.children.find((c) => c.id === s.activeChild) ?? null

/** Adds a child and makes them the one using the app. Pure. */
export const addChild = (s: AppState, child: Child): AppState => ({ ...s, children: [...s.children, child], activeChild: child.id })

/** Removes a child and their progress; another child (if any) becomes the active one. Pure. */
export function removeChild(s: AppState, id: string): AppState {
  const children = s.children.filter((c) => c.id !== id)
  return { ...s, children, activeChild: s.activeChild === id ? (children[0]?.id ?? null) : s.activeChild }
}

/** Changes one child. Pure. */
export const updateChild = (s: AppState, id: string, change: (c: Child) => Child): AppState => ({ ...s, children: s.children.map((c) => (c.id === id ? change(c) : c)) })

/** "YYYY-MM-DD" in local time. */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
