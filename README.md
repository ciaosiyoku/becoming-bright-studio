# Becoming Bright Studio

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/png/wordmark-dark.png">
    <img src="brand/png/wordmark-light.png" alt="Becoming Bright Studio" width="420">
  </picture>
</p>

<p align="center"><b>Every day a little brighter.</b></p>

**Short lessons that explain themselves, one skill at a time, for children aged 4 to 11. The child chooses the skill.** It works in the browser
and does not block other apps. Everything stays on the family's device: no accounts, no tracking.

- **Install:** https://ciaosiyoku.github.io/becoming-bright-studio/install.html (steps for your device, QR code)
- **Open the app:** https://ciaosiyoku.github.io/becoming-bright-studio/

> **Version 1, in testing.** It has passed its automated tests and been clicked through in a browser, but no child
> has used it yet ([docs/CHILD-TEST.md](docs/CHILD-TEST.md)). German, French and Yoruba have not yet been read
> aloud by native speakers.

The original [Kids' Learning Studio](https://github.com/Oluwasedago/kids-learning-studio) by Oluwasedago was a
strong shell with a weak lesson. This version puts **the lesson first, and a parent page that doesn't pretend to
be a lock.** The games, radio, stories, videos and explore items are back around the lesson, each Off, Open or
**Earn first**. The earlier version is kept in the
[`v0-full-shell`](https://github.com/ciaosiyoku/becoming-bright-studio/tree/v0-full-shell) tag.

## One session, one skill

Written down before any code in the [learning contract](docs/LEARNING-CONTRACT.md):

1. **Teach card:** one picture or number line, one sentence, read aloud.
2. **Two guided tries:** the child answers, then sees the right answer and a one-line reason. These don't count.
3. **Five checks:** one try each, then the reason. **4 of 5 means mastered**: the skill becomes a tree on the home
   screen, and the next one of the same subject is suggested.

After every answer, the right one turns green and the reason stays on screen until the child taps **Next**, which
unlocks after a moment. Nothing moves on by itself, so red never means "go faster".

**95 skills, and the child chooses.** The child picks a subject, then a skill. The Learn tab then shows only that
skill, with "Choose another skill" next to it. Nothing is locked.

- **Numbers (31):** counting; adding and taking away within 5, 10, 20, 100 and 1000; one more and one less; tens
  and ones; times tables; hours, minutes and seconds; place value; rounding; dividing; multiplying; fractions;
  percentages; order of operations; square numbers.
- **Sounds and words (27, taught in English):** first sounds, rhymes, reading and spelling words, the missing letter,
  "a" or "an", plurals, the past tense, alphabetical order, opposites, short forms, comparing, synonyms, homophones,
  word classes, prefixes, capital letters, punctuation, question words, prepositions, pronouns, compound words,
  suffixes, conjunctions, collective nouns, apostrophes.
- **Patterns (9):** picture patterns and number sequences.
- **Science (16):** living things, body, senses, animals, plants, healthy eating, materials, habitats, weather,
  states of matter, magnets, forces, light, sound, space, electricity.
- **French (12, taught in French):** greetings, colours, numbers, animals, fruit, body and family, days, weather,
  le/la/l', être and avoir, plurals, sentences.

Numbers are made fresh each time so answers can't be learnt by heart. Science, French and the newer English skills
are hand-written question banks. A test checks that every question, and every teach card's example, has **exactly
one right answer** in every language shipped.

## Around the lessons

| Tab | Items |
|---|---|
| **Games** | Memory (cards from a learnt skill's questions), Word builder, Code breaker, Picture puzzle, Number slide |
| **Listen and watch** | Children's radio (live), Stories (LibriVox, public domain), Videos (a checked library from official channels) |
| **Explore** | Places of the world (real photos with credits), 100 Whys, Did you know? |

The grown-ups set each item to **Off**, **Open** or **Earn first**. With Earn first, a passed lesson earns minutes
(10 at first, up to 45 a day), and the clock at the top shows what's left.

## For grown-ups

- **One screen, behind a PIN:** a **learning report** per child (today, 7 days, 30 days: lessons, passed, checks
  right, skills learnt, time per area, questions to practise again, Send by email), children, Off / Open / Earn first
  for every item, minutes per lesson and per day, language, voice, backup, the PIN, and **Update now**.
- **PIN:** stored as a salted hash. A **recovery code** is shown once at setup, with a Print button. There is no
  24-hour reset: without the code, the way back is starting again from a backup (backups never hold the PIN).
- **Backup** in one file, with an automatic reminder once a week.
- **Several children** on one device: each with a name, a colour and their own progress. One PIN for the family.
- **Updates:** the app checks for a new version once a day and loads it between activities, never in the middle
  of a lesson or a video. **Update now** fetches it straight away.
- **Reading voice:** female or male. The voices come from the device; when it has none of the chosen kind, the
  nearest voice reads a little lower or higher, and the grown-ups' screen says so.
- **Languages:** English, Deutsch, Français, Yorùbá. The English sound and word lessons stay in English.

## What it is not

- Not a lock. Keeping a child in one app is a device setting (Guided Access on iPad, App pinning on Android). A
  bedtime or home-screen lock would be a native app, a later product.
- Not a video app: a small, checked library only, behind the grown-ups' setting. No ads of our own.
- No server and no accounts.

## For contributors

Node 22+, Vite, React, TypeScript, Vitest.

```sh
npm install        # once
npm run dev        # the app at http://localhost:5173 (install page: /install.html)
npm test           # unit tests, including every question of every skill in every language
npm run lint
npm run build      # the finished site in dist/
```

Every push to `main` is checked, built and published to GitHub Pages by `.github/workflows/deploy.yml`.

| Where | What |
|---|---|
| `docs/LEARNING-CONTRACT.md` | Who it's for, one session, what the parent sees, what it won't do, the session on paper |
| `docs/CHILD-TEST.md` | How to test a skill with one child, and what to change for what you see |
| `src/skills/*.json` | One file per skill: its words in each language and its question maker |
| `src/skills/generate.ts`, `numbers.ts`, `words.ts` | The question makers and teach cards |
| `src/lesson/` | The session (teach, guided, checks) and its screen |
| `src/parent/` | PIN, recovery code, the grown-ups' screen |
| `src/skills/bank.ts` | Question banks (science, French, newer English skills); `scripts/bank-example.py` sets each bank's teach example |
| `src/games/` | Memory, word builder, code breaker, picture puzzle, number slide |
| `src/media/` | Radio, stories, videos |
| `src/explore/` | Places of the world, 100 Whys, Did you know? |
| `src/app/items.ts`, `access.ts` | The items of each tab, Off / Open / Earn first, earned time |
| `src/parent/report.ts` | The learning report (pure, tested) |
| `src/i18n/` | Every sentence, one file per language |
| `src/app/state.ts` | The one document saved on the device (one IndexedDB key) |

**Adding a skill:** add a JSON file to `src/skills/` (copy one of the same kind, give it the next `order`), then run
`npm test`. The app picks up every file in that folder. **Adding a language:** copy `src/i18n/en.ts`, add the skill texts, and have a native speaker read every
child-facing sentence aloud first.

## Credits and licence

Code: [MIT](LICENSE), based on Kids' Learning Studio by Oluwasedago. Logo: original, drawn by
`scripts/make-brand.mjs` ([brand/](brand/README.md)). Pictures: [Microsoft Fluent Emoji](public/emoji/CREDITS.md)
(MIT). Place photos: Wikimedia Commons, free licences ([credits](public/photos/CREDITS.md)). Stories: LibriVox
(public domain). Fonts: Andika and Fredoka (SIL Open Font License).
