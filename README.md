# Becoming Bright Studio

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/png/wordmark-dark.png">
    <img src="brand/png/wordmark-light.png" alt="Becoming Bright Studio" width="420">
  </picture>
</p>

<p align="center"><b>Every day a little brighter.</b></p>

**Short lessons that explain themselves, one skill at a time, for children aged 5 to 7.** It works in the browser
and does not block other apps. Everything stays on the family's device: no accounts, no tracking, no videos.

- **Install:** https://ciaosiyoku.github.io/becoming-bright-studio/install.html (steps for your device, QR code)
- **Open the app:** https://ciaosiyoku.github.io/becoming-bright-studio/

> **Version 1, in testing.** It has passed its automated tests and been clicked through in a browser, but no child
> has used it yet ([docs/CHILD-TEST.md](docs/CHILD-TEST.md)). German, French and Yoruba have not yet been read
> aloud by native speakers.

The original [Kids' Learning Studio](https://github.com/Oluwasedago/kids-learning-studio) by Oluwasedago was a
strong shell with a weak lesson. This version is the opposite: **a short lesson that explains itself, and a parent
page that doesn't pretend to be a lock.** The earlier, bigger version (map, radio, games, 58 skills) is kept in the
[`v0-full-shell`](https://github.com/ciaosiyoku/becoming-bright-studio/tree/v0-full-shell) tag.

## One session, one skill

Written down before any code in the [learning contract](docs/LEARNING-CONTRACT.md):

1. **Teach card:** one picture or number line, one sentence, read aloud.
2. **Two guided tries:** the child answers, then sees the right answer and a one-line reason. These don't count.
3. **Five checks:** one try each, then the reason. **4 of 5 means mastered**, and the next skill opens.

After every answer, the right one turns green and the reason stays on screen until the child taps **Next**, which
unlocks after a moment. Nothing moves on by itself, so red never means "go faster".

**Twelve skills:** count to 5 and to 10, one more, one less, add within 5 and 10, take away within 5 and 10, which
is bigger, first sounds, "a" or "an", rhyming pictures. Numbers are made fresh each time so answers can't be learnt
by heart. A test checks that every question has **exactly one right answer** in every language shipped.

## For grown-ups

- **One screen, behind a PIN:** each child's misses today with the right answers, skills learnt, children, a
  **games allowed** switch, language, backup, and changing the PIN.
- **PIN:** stored as a salted hash. A **recovery code** is shown once at setup, with a Print button. There is no
  24-hour reset: without the code, the way back is starting again from a backup (backups never hold the PIN).
- **Backup** in one file, with an automatic reminder once a week.
- **Several children** on one device: each with a name, a colour and their own progress. One PIN for the family.
- **Reward:** only when games are allowed, a learnt skill unlocks a **5-minute memory game made of that skill's own
  questions** ("3 + 2" pairs with "5"). No YouTube, no video, no internet.
- **Languages:** English, Deutsch, Français, Yorùbá. The English sound and word lessons stay in English.

## What it is not

- Not a lock. Keeping a child in one app is a device setting (Guided Access on iPad, App pinning on Android). A
  bedtime or home-screen lock would be a native app, a later product.
- Not a video app, and no radio, map or ads.
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
| `src/skills/generate.ts` | The question makers and teach cards |
| `src/lesson/` | The session (teach, guided, checks) and its screen |
| `src/parent/` | PIN, recovery code, the grown-ups' screen |
| `src/games/` | The memory game a learnt skill unlocks |
| `src/i18n/` | Every sentence, one file per language |
| `src/app/state.ts` | The one document saved on the device (one IndexedDB key) |

**Adding a skill:** add a JSON file (copy one of the same kind) and list it in `src/skills/index.ts`, then run
`npm test`. **Adding a language:** copy `src/i18n/en.ts`, add the skill texts, and have a native speaker read every
child-facing sentence aloud first.

## Credits and licence

Code: [MIT](LICENSE), based on Kids' Learning Studio by Oluwasedago. Logo: original, drawn by
`scripts/make-brand.mjs` ([brand/](brand/README.md)). Pictures: [Microsoft Fluent Emoji](public/emoji/CREDITS.md)
(MIT). Fonts: Andika and Fredoka (SIL Open Font License).
