import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const SKILLS_DIR = fileURLToPath(new URL('./src/skills', import.meta.url))

/**
 * "virtual:skill-meta": every skill in src/skills/*.json without its "params" (the question makers' settings, which
 * hold the question banks: most of the 2.5 MB). The app starts with this list; a lesson loads its full skill when it
 * opens (src/skills/index.ts). Restart `npm run dev` after adding a skill file.
 */
function skillMeta(): Plugin {
  const id = 'virtual:skill-meta'
  const resolved = '\0' + id
  return {
    name: 'skill-meta',
    resolveId: (source) => (source === id ? resolved : null),
    load(loadId) {
      if (loadId !== resolved) return null
      const files = readdirSync(SKILLS_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort()
      const skills = files.map((f) => {
        const path = `${SKILLS_DIR}/${f}`
        this.addWatchFile(path)
        const skill = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
        delete skill.params
        return skill
      })
      return `export default ${JSON.stringify(skills)}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // './' = every file is linked relative to the page, so the same build works at
  // https://<user>.github.io/becoming-bright-studio/, on a fork with another name, or at a domain's root.
  base: './',
  plugins: [react(), skillMeta()],
  build: {
    // dist/asset-manifest.json: every file of this version. The app reads it to save them all for offline use
    // and to delete older versions' files (src/shared/offline.ts).
    manifest: 'asset-manifest.json',
    // Two pages: the app (index.html) and the install page (install.html).
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        install: fileURLToPath(new URL('./install.html', import.meta.url)),
      },
    },
  },
  resolve: {
    // "@/..." means "src/...". Keep in sync with "paths" in tsconfig.app.json.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
