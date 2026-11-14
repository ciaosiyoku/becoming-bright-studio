import { Emoji } from '@/shared/Emoji'
import type { Scene } from './scenes'
import './Stage.css'

/** What each backdrop has in it: a few pictures placed around the sky and the ground (all from public/emoji). */
const PROPS: Record<Scene['backdrop'], { emoji: string; x: number; y: number; size: number }[]> = {
  meadow: [
    { emoji: 'sun', x: 84, y: 8, size: 54 },
    { emoji: 'cloud', x: 12, y: 10, size: 46 },
    { emoji: 'seedling', x: 8, y: 70, size: 34 },
    { emoji: 'seedling', x: 90, y: 74, size: 30 },
  ],
  forest: [
    { emoji: 'tree', x: 4, y: 34, size: 84 },
    { emoji: 'tree', x: 84, y: 30, size: 92 },
    { emoji: 'sun-small-cloud', x: 46, y: 6, size: 44 },
  ],
  water: [
    { emoji: 'sun-small-cloud', x: 82, y: 6, size: 48 },
    { emoji: 'wave', x: 6, y: 74, size: 40 },
    { emoji: 'wave', x: 84, y: 78, size: 36 },
  ],
  sky: [
    { emoji: 'cloud', x: 6, y: 14, size: 56 },
    { emoji: 'cloud', x: 70, y: 60, size: 50 },
    { emoji: 'sun', x: 86, y: 6, size: 46 },
  ],
  night: [
    { emoji: 'moon', x: 82, y: 8, size: 52 },
    { emoji: 'glowstar', x: 12, y: 10, size: 22 },
    { emoji: 'glowstar', x: 34, y: 22, size: 16 },
    { emoji: 'glowstar', x: 60, y: 8, size: 18 },
  ],
  snow: [
    { emoji: 'snowflake', x: 10, y: 10, size: 26 },
    { emoji: 'snowflake', x: 52, y: 4, size: 20 },
    { emoji: 'snowflake', x: 84, y: 16, size: 24 },
    { emoji: 'snowman', x: 86, y: 52, size: 70 },
  ],
  town: [
    { emoji: 'house', x: 4, y: 40, size: 80 },
    { emoji: 'house', x: 84, y: 44, size: 70 },
    { emoji: 'sun-small-cloud', x: 46, y: 6, size: 44 },
  ],
}

/**
 * One scene on a little stage: the backdrop, then the cast moving the way the words say. Decoration only (the words
 * are shown and read beside it). `playing` false holds every movement still; the grown-ups' "calm" setting stops
 * them anyway (global.css).
 */
export function Stage({ scene, playing = true, big = false }: { scene: Scene; playing?: boolean; big?: boolean }) {
  const size = big ? 104 : 80
  return (
    <div className={`stage stage-${scene.backdrop} ${playing ? '' : 'paused'} ${big ? 'big' : ''}`} aria-hidden="true">
      {PROPS[scene.backdrop].map((p, i) => (
        <span key={i} className="stage-prop" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <Emoji name={p.emoji} size={p.size} />
        </span>
      ))}
      <div className="stage-ground" />
      <div className="stage-cast">
        {scene.cast.map((emoji, i) => (
          <span key={`${emoji}-${i}`} className={`actor act-${scene.action}`} style={{ animationDelay: `${i * 0.25}s` }}>
            <Emoji name={emoji} size={size} />
            {scene.action === 'sleep' && <b className="zzz">z</b>}
          </span>
        ))}
      </div>
    </div>
  )
}
