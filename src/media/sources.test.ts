import { describe, expect, it } from 'vitest'
import { callLinkOk, embedUrl, parseYouTube, STATIONS } from './sources'
import { STORIES } from './storyList'
import { AGE_BANDS } from '@/skills/ages'

describe('listen and watch sources', () => {
  it('only uses HTTPS addresses', () => {
    for (const s of STATIONS) expect(s.url).toMatch(/^https:\/\//)
    for (const c of STORIES) for (const t of c.tracks) expect(t.url).toMatch(/^https:\/\/archive\.org\/download\//)
  })
  it('reads YouTube links of every common shape', () => {
    expect(parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toEqual({ kind: 'video', id: 'dQw4w9WgXcQ' })
    expect(parseYouTube('https://youtu.be/dQw4w9WgXcQ')).toEqual({ kind: 'video', id: 'dQw4w9WgXcQ' })
    expect(parseYouTube('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({ kind: 'video', id: 'dQw4w9WgXcQ' })
    expect(parseYouTube('https://www.youtube.com/playlist?list=PL1234567890abc')).toEqual({ kind: 'playlist', id: 'PL1234567890abc' })
    expect(parseYouTube('https://example.com/video')).toBeNull()
  })
  it('plays videos through youtube-nocookie without related videos from other channels', () => {
    expect(embedUrl({ kind: 'video', id: 'dQw4w9WgXcQ' })).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?.*rel=0/)
  })
  it('accepts only call links that start a call', () => {
    expect(callLinkOk('tel:+44 20 7946 0000')).toBe(true)
    expect(callLinkOk('https://wa.me/447700900000')).toBe(true)
    expect(callLinkOk('facetime:someone@example.com')).toBe(true)
    expect(callLinkOk('https://example.com')).toBe(false)
    expect(callLinkOk('javascript:alert(1)')).toBe(false)
  })
})

describe('stories', () => {
  it('has at least 50 stories for every age range, each with a different id', () => {
    for (const band of AGE_BANDS) expect(STORIES.filter((c) => c.band === band).reduce((n, c) => n + c.tracks.length, 0), band).toBeGreaterThanOrEqual(50)
    const ids = STORIES.flatMap((c) => c.tracks.map((t) => t.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})
