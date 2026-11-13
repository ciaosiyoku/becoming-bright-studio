import { appScript } from './autoUpdate'

// Every file of this version, saved on the device; older versions' files deleted.
//
// The app loads its parts when they open (a lesson's questions, a game, the grown-ups' screen …), so the first
// screen is quick. So that every part still opens without Wi-Fi, this saves all of them in the background a few
// seconds after the app starts, in the service worker's cache (public/sw.js). Without it, a part never opened
// online could not open offline.
//
// It also deletes the files of older versions from that cache. Each version's files have new names
// (assets/app-B8eSRqwV.js …), so without this the cache grew by the whole app (about 2.5 MB) with every update.
//
// The list of this version's files is dist/asset-manifest.json (build.manifest in vite.config.ts). Nothing happens
// when it can't be read (offline) or names another version than the one running (an update is out: autoUpdate.ts
// reloads into it soon, and this runs again then). Pictures, photos and icons (public/) keep their names and stay.

/** The service worker's cache. Keep in sync with CACHE in public/sw.js. */
const CACHE = 'bbs-v2'
/** Files saved at once, so the lesson in use isn't slowed down. */
const AT_ONCE = 4

interface ManifestChunk {
  file: string
  css?: string[]
  assets?: string[]
}

/** The files a build manifest names, as paths relative to the app ("assets/app-B8eSRqwV.js"). Pure (tested). */
export function manifestFiles(manifest: Record<string, ManifestChunk>): string[] {
  const files = new Set<string>()
  for (const chunk of Object.values(manifest)) for (const f of [chunk.file, ...(chunk.css ?? []), ...(chunk.assets ?? [])]) files.add(f)
  return [...files].sort()
}

/** Does the manifest belong to the version running? Its files then include the app file the page started with. Pure (tested). */
export const isRunningVersion = (files: string[], running: string | null): boolean => running !== null && files.includes(running)

/** Saves this version's files and deletes older versions' files. Never throws. */
export async function syncOfflineFiles(): Promise<void> {
  try {
    if (!('caches' in window)) return
    const res = await fetch('./asset-manifest.json', { cache: 'no-store' })
    if (!res.ok) return
    const files = manifestFiles((await res.json()) as Record<string, ManifestChunk>)
    if (!isRunningVersion(files, appScript(document.documentElement.outerHTML))) return

    const wanted = new Set(files.map((f) => new URL(f, document.baseURI).href))
    const cache = await caches.open(CACHE)
    const saved = new Set((await cache.keys()).map((r) => r.url))

    // Older versions' files.
    const assets = new URL('assets/', document.baseURI).href
    for (const url of saved) if (url.startsWith(assets) && !wanted.has(url)) await cache.delete(url)

    // This version's files not saved yet, a few at a time.
    const missing = [...wanted].filter((url) => !saved.has(url))
    for (let i = 0; i < missing.length; i += AT_ONCE) await Promise.all(missing.slice(i, i + AT_ONCE).map((url) => cache.add(url).catch(() => undefined)))
  } catch {
    // Offline, or no cache storage (private browsing): the app works as before.
  }
}
