import type { Lang } from '@/i18n'

// What is read aloud, in words: the device voices read maths signs badly or not at all ("4 − 2" came out as "4 2",
// "→" and "_" as nothing, fractions as dates), and some read picture characters by name. So before a sentence is
// read, signs between numbers become words in the app language: minus, plus, times, divided by, equals, more and less
// than, per cent, degrees, a fraction's name, a gap ("what"), and "→" a short "that makes". The screen keeps the signs.
// Pure (tested in spoken.test.ts).

interface Words {
  minus: string
  plus: string
  times: string
  divided: string
  equals: string
  less: string
  more: string
  gap: string
  makes: string
  percent: string
  degrees: string
  /** A fraction in words: 3, 4 → "3 quarters". */
  fraction: (n: number, d: number) => string
}

const EN_DEN: Record<number, [string, string]> = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['quarter', 'quarters'],
  5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'],
  7: ['seventh', 'sevenths'],
  8: ['eighth', 'eighths'],
  9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'],
  12: ['twelfth', 'twelfths'],
  100: ['hundredth', 'hundredths'],
}
const DE_DEN: Record<number, string> = { 3: 'Drittel', 4: 'Viertel', 5: 'Fünftel', 6: 'Sechstel', 7: 'Siebtel', 8: 'Achtel', 9: 'Neuntel', 10: 'Zehntel', 12: 'Zwölftel', 100: 'Hundertstel' }
const FR_DEN: Record<number, [string, string]> = {
  2: ['demi', 'demis'],
  3: ['tiers', 'tiers'],
  4: ['quart', 'quarts'],
  5: ['cinquième', 'cinquièmes'],
  6: ['sixième', 'sixièmes'],
  7: ['septième', 'septièmes'],
  8: ['huitième', 'huitièmes'],
  9: ['neuvième', 'neuvièmes'],
  10: ['dixième', 'dixièmes'],
  12: ['douzième', 'douzièmes'],
  100: ['centième', 'centièmes'],
}

const WORDS: Record<Lang, Words> = {
  en: {
    minus: 'minus',
    plus: 'plus',
    times: 'times',
    divided: 'divided by',
    equals: 'equals',
    less: 'is less than',
    more: 'is more than',
    gap: 'what',
    makes: 'that makes',
    percent: 'percent',
    degrees: 'degrees',
    fraction: (n, d) => (EN_DEN[d] ? `${n === 1 ? 'one' : n} ${EN_DEN[d][n === 1 ? 0 : 1]}` : `${n} over ${d}`),
  },
  de: {
    minus: 'minus',
    plus: 'plus',
    times: 'mal',
    divided: 'geteilt durch',
    equals: 'gleich',
    less: 'ist kleiner als',
    more: 'ist größer als',
    gap: 'wie viel',
    makes: 'das ergibt',
    percent: 'Prozent',
    degrees: 'Grad',
    fraction: (n, d) => (d === 2 ? (n === 1 ? 'ein Halb' : `${n} Halbe`) : DE_DEN[d] ? `${n === 1 ? 'ein' : n} ${DE_DEN[d]}` : `${n} durch ${d}`),
  },
  fr: {
    minus: 'moins',
    plus: 'plus',
    times: 'fois',
    divided: 'divisé par',
    equals: 'égale',
    less: 'est plus petit que',
    more: 'est plus grand que',
    gap: 'combien',
    makes: 'ça fait',
    percent: 'pour cent',
    degrees: 'degrés',
    fraction: (n, d) => (FR_DEN[d] ? `${n === 1 ? 'un' : n} ${FR_DEN[d][n === 1 ? 0 : 1]}` : `${n} sur ${d}`),
  },
  yo: {
    minus: 'yọ',
    plus: 'àti',
    times: 'ìlọ́po',
    divided: 'pín sí',
    equals: 'jẹ́',
    less: 'kéré ju',
    more: 'tóbi ju',
    gap: 'mélòó',
    makes: 'ó di',
    percent: 'nínú ọgọ́rùn-ún',
    degrees: 'ìwọ̀n',
    fraction: (n, d) => `${n} nínú ${d}`,
  },
}

// A number as written in the questions: 12, 3.5, 3,5, 1 000, 1,000 (no sign, which is read as a word here).
const NUM = String.raw`\d+(?:[.,]\d+)?`

/** A sentence as it should be read aloud in a language. */
export function forSpeech(text: string, lang: Lang): string {
  const w = WORDS[lang]
  let s = text
    // Pictures (emoji) are not read out by name.
    .replace(/\p{Extended_Pictographic}️?/gu, ' ')
    // A gap to fill in an equation: _, __ or □ anywhere; ? only next to a sign (a French question ends in " ?").
    .replace(/(^|[\s(=+−×÷·-])(?:_+|□)(?=\s|$|[=+−×÷·<>).,!?-])/g, `$1 ${w.gap} `)
    .replace(/([=+−×÷·<>]\s*)\?(?=\s|$|[.,!])/g, `$1 ${w.gap} `)
    .replace(/(^|\s)\?(?=\s*[=+−×÷·<>])/g, `$1 ${w.gap} `)
    // Fractions: 3/4, but not dates or longer slashes (1/2/3).
    .replace(new RegExp(String.raw`(?<![\d/])(\d{1,3})\s*/\s*(\d{1,3})(?![\d/])`, 'g'), (_, n: string, d: string) => ` ${w.fraction(+n, +d)} `)
    .replace(/(\d)\s*%/g, `$1 ${w.percent}`)
    .replace(/(\d)\s*°(C|F)?/g, (_, d: string, unit?: string) => `${d} ${w.degrees}${unit ? ` ${unit}` : ''}`)
    // Signs between numbers (or a gap, already a word, or a bracket).
    // Minus: the minus sign anywhere, a hyphen only with spaces between numbers ("4 - 2", not "well-known" or 10–12).
    .replace(new RegExp(String.raw`(${NUM}|\)|${w.gap})\s+-\s+(?=${NUM}|\(|${w.gap})`, 'g'), `$1 ${w.minus} `)
    .replace(/\s*[−]\s*/g, ` ${w.minus} `)
    .replace(/\s*\+\s*/g, ` ${w.plus} `)
    .replace(/\s*[×·]\s*/g, ` ${w.times} `)
    .replace(/\s*÷\s*/g, ` ${w.divided} `)
    .replace(/\s*=\s*/g, ` ${w.equals} `)
    .replace(new RegExp(String.raw`(${NUM}|${w.gap})\s*<\s*(?=${NUM}|${w.gap})`, 'g'), `$1 ${w.less} `)
    .replace(new RegExp(String.raw`(${NUM}|${w.gap})\s*>\s*(?=${NUM}|${w.gap})`, 'g'), `$1 ${w.more} `)
    // An arrow in an explanation: "jump back 4 → 5" reads "jump back 4, that makes 5".
    .replace(/\s*[→⟶]\s*/g, `, ${w.makes} `)
    .replace(/\s*[←]\s*/g, ', ')
    // A trailing or lone ellipsis is a pause, not a word.
    .replace(/…/g, ', ')
  s = s.replace(/\s+([,.!?])/g, '$1').replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim()
  return s
}
