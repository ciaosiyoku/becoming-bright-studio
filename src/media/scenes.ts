// Animated scenes for the fables and the stories, made from their words (no hand-made art): each paragraph of a
// fable is a scene; the animals named in it come on stage (pictures from public/emoji), the place it describes is the
// backdrop, and what they do (running, flying, swimming, sleeping …) is how they move. Pure (tested in scenes.test.ts).

export type Backdrop = 'meadow' | 'forest' | 'water' | 'sky' | 'night' | 'snow' | 'town'
export type Action = 'idle' | 'run' | 'hop' | 'fly' | 'swim' | 'fall' | 'sleep' | 'shake'

export interface Scene {
  /** Up to three pictures on stage, in the order the story names them. */
  cast: string[]
  backdrop: Backdrop
  action: Action
  /** The words read aloud with this scene. */
  text: string
}

/** Animals and things the stories talk about, and their picture (generic pictures, no known characters). */
const CAST: [RegExp, string][] = [
  [/\b(lions?|lioness)\b/, 'animal-lion'],
  [/\b(mouse|mice|rats?)\b/, 'animal-mouse'],
  [/\b(fox|foxes|vixen)\b/, 'animal-fox'],
  [/\b(tortoises?|turtles?|ìjàpá)\b/, 'animal-turtle'],
  [/\b(hares?|rabbits?|bunn(y|ies))\b/, 'animal-rabbit'],
  [/\b(swans?|geese|goose|ducks?|ducklings?)\b/, 'animal-swan'],
  [/\b(hens?|chicks?|rooster|cock|chickens?)\b/, 'chick'],
  [/\b(crows?|ravens?|jackdaws?|jays?|sparrows?|larks?|pigeons?|doves?|parrots?|quails?|birds?|eagles?|hawks?|kites?|swallows?|nightingale|woodpecker)\b/, 'animal-parrot'],
  [/\b(peacocks?)\b/, 'animal-peacock'],
  [/\b(storks?|cranes?|herons?|flamingos?)\b/, 'animal-flamingo'],
  [/\b(owls?)\b/, 'animal-owl'],
  [/\b(tigers?|leopards?)\b/, 'animal-tiger'],
  [/\b(bears?)\b/, 'animal-bear'],
  [/\b(elephants?)\b/, 'animal-elephant'],
  [/\b(frogs?)\b/, 'animal-frog'],
  [/\b(deer|stags?|gazelles?)\b/, 'deer'],
  [/\b(horses?|donkeys?|mules?|ass)\b/, 'animal-horse'],
  [/\b(cows?|oxen|ox|bulls?|calf|goats?|sheep|lambs?|ram)\b/, 'animal-cow'],
  [/\b(camels?)\b/, 'animal-camel'],
  [/\b(hippo|hippopotamus)\b/, 'animal-hippopotamus'],
  [/\b(crabs?|crayfish)\b/, 'animal-crab'],
  [/\b(snails?)\b/, 'animal-snail'],
  [/\b(bees?|wasps?|gnats?|mosquito(es)?|hornets?|drones?)\b/, 'animal-honeybee'],
  [/\b(ants?|grasshoppers?|crickets?|beetles?)\b/, 'animal-lady-beetle'],
  [/\b(butterfl(y|ies)|chrysalis)\b/, 'animal-butterfly'],
  [/\b(snakes?|serpents?|python|vipers?)\b/, 'snake'],
  [/\b(fish|fishes|pike|carp)\b/, 'animal-dolphin'],
  [/\b(whales?)\b/, 'animal-spouting-whale'],
  [/\b(hedgehogs?)\b/, 'animal-hedgehog'],
  [/\b(squirrels?)\b/, 'animal-chipmunk'],
  [/\b(bats?)\b/, 'animal-bat'],
  [/\b(monkeys?)\b/, 'fruit-banana'],
  [/\b(dogs?|hounds?|puppy|wolf|wolves|jackals?|cats?|kittens?)\b/, 'paws'],
  [/\b(girl|princess|milkmaid|woman|mother|grandma)\b/, 'girl'],
  [/\b(grapes)\b/, 'fruit-grapes'],
  [/\b(cheese|bread|cake|cookie|gingerbread)\b/, 'cake'],
  [/\b(bones?)\b/, 'bone'],
  [/\b(eggs?|gold|golden|jewels?|coins?|treasure)\b/, 'glowstar'],
  [/\b(bells?)\b/, 'bell'],
]

const BACKDROPS: [Backdrop, RegExp][] = [
  ['night', /\b(night|moon|stars?|dark|asleep|sleep|slept|dream(ed|t)?|evening)\b/],
  ['snow', /\b(snow|snowy|winter|ice|frozen|mitten)\b/],
  ['water', /\b(river|pond|lake|sea|(the|a|into) well|stream|water|swim|swam|swimming|bridge|ship|boat|shore|wave)\b/],
  ['sky', /\b(sky|flew|fly|flying|clouds?|air|wings?|cliff|mountain)\b/],
  ['forest', /\b(forest|woods?|trees?|jungle|branch(es)?|vine|bush)\b/],
  ['town', /\b(town|village|house|market|palace|king|queen|shop|city|home|hut|cave|kitchen)\b/],
]

const ACTIONS: [Action, RegExp][] = [
  ['sleep', /\b(sleep(ing)?|slept|asleep|nap|doz(ed|ing)|dream(ed)?|lay down)\b/],
  ['fall', /\b(fell|falls?|falling|tumbled?|dropped|drops?|crash|splash|plop|sank)\b/],
  ['fly', /\b(fl(y|ew|ies|ying)|soared?|swoop(ed)?)\b/],
  ['swim', /\b(sw(im|am|imming)|float(ed|ing)?)\b/],
  ['run', /\b(r(a|u)n|running|race[ds]?|chas(e|ed|ing)|hurried|rushed|raced)\b/],
  ['hop', /\b(jump(ed|s)?|leapt?|hop(ped)?|danc(e|ed|ing)|bounce[ds]?|puffed)\b/],
  ['shake', /\b(roar(ed)?|growl(ed)?|shook|shiver(ed|ing)?|trembl(ed|ing)|cried|angry|furious|scared|frightened|fright)\b/],
]

/** The pictures a text names, in order, without repeats (at most `max`). */
export function castOf(text: string, max = 3): string[] {
  const t = text.toLowerCase()
  const found: { at: number; emoji: string }[] = []
  for (const [re, emoji] of CAST) {
    const m = new RegExp(re.source, 'g').exec(t)
    if (m && !found.some((f) => f.emoji === emoji)) found.push({ at: m.index, emoji })
  }
  return found.sort((a, b) => a.at - b.at).slice(0, max).map((f) => f.emoji)
}

export const backdropOf = (text: string, fallback: Backdrop = 'meadow'): Backdrop => BACKDROPS.find(([, re]) => re.test(text.toLowerCase()))?.[0] ?? fallback

export const actionOf = (text: string): Action => ACTIONS.find(([, re]) => re.test(text.toLowerCase()))?.[0] ?? 'idle'

/**
 * A fable as scenes: one per paragraph. Every scene has someone on stage: the animals it names, or else the ones on
 * stage before, or else the fable's own picture. The place carries over from the scene before when a paragraph
 * names none.
 */
export function scenesOf(paragraphs: string[], emoji: string): Scene[] {
  const scenes: Scene[] = []
  let cast = [emoji]
  let backdrop: Backdrop = 'meadow'
  for (const text of paragraphs) {
    const named = castOf(text)
    cast = named.length ? named : cast
    backdrop = backdropOf(text, backdrop)
    scenes.push({ cast, backdrop, action: actionOf(text), text })
  }
  return scenes
}

/** A story recording's scene, from its title and its book's picture: who is in it and where, moving gently. */
export function storyScene(title: string, emoji: string): Scene {
  const named = castOf(title, 2)
  return { cast: named.length ? named : [emoji], backdrop: backdropOf(title), action: 'idle', text: title }
}

/** A text's words with where each starts (to light up the word being read). Pure. */
export function wordsOf(text: string): { word: string; at: number }[] {
  return [...text.matchAll(/\S+/g)].map((m) => ({ word: m[0], at: m.index ?? 0 }))
}

/** Which word (index) is being read, from the character the speech engine says it reached. Pure. */
export function wordAt(words: { at: number }[], charIndex: number): number {
  let i = -1
  for (let k = 0; k < words.length && words[k].at <= charIndex; k++) i = k
  return i
}
