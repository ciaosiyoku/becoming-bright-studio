import { describe, expect, it } from 'vitest'
import { detectDevice } from './device'

describe('install page device', () => {
  it('knows Android (and Fire), iPad (and iPhone), and computers', () => {
    expect(detectDevice('Mozilla/5.0 (Linux; Android 14; SM-X200) Chrome/130')).toBe('android')
    expect(detectDevice('Mozilla/5.0 (Linux; Android 11; KFTRWI) Silk/120')).toBe('android')
    expect(detectDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('ipad')
    expect(detectDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605', 5)).toBe('ipad')
    expect(detectDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605', 0)).toBe('computer')
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/130')).toBe('computer')
  })
})
