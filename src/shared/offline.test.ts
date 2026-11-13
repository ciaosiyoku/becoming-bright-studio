import { describe, expect, it } from 'vitest'
import { isRunningVersion, manifestFiles } from './offline'

// A build manifest as Vite writes it (dist/asset-manifest.json), shortened.
const manifest = {
  'index.html': { file: 'assets/app-AAAA.js', css: ['assets/app-BBBB.css'], assets: ['assets/andika-CCCC.woff2'] },
  'install.html': { file: 'assets/install-DDDD.js', css: ['assets/app-BBBB.css'] },
  'src/games/Memory.tsx': { file: 'assets/Memory-EEEE.js', css: ['assets/Memory-FFFF.css'] },
  'src/skills/add-5.json': { file: 'assets/add-5-GGGG.js' },
}

describe('offline files', () => {
  it('lists every file of the version once', () => {
    expect(manifestFiles(manifest)).toEqual([
      'assets/Memory-EEEE.js',
      'assets/Memory-FFFF.css',
      'assets/add-5-GGGG.js',
      'assets/andika-CCCC.woff2',
      'assets/app-AAAA.js',
      'assets/app-BBBB.css',
      'assets/install-DDDD.js',
    ])
  })

  it('belongs to the version running only when it names the app file the page started with', () => {
    const files = manifestFiles(manifest)
    expect(isRunningVersion(files, 'assets/app-AAAA.js')).toBe(true)
    expect(isRunningVersion(files, 'assets/app-ZZZZ.js')).toBe(false)
    expect(isRunningVersion(files, null)).toBe(false)
  })
})
