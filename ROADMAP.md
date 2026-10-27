# Roadmap

Legend: **done** · **to verify** (built, needs checking on a device or with a source) · **planned**

## v1 (now)

| Area | Status |
|---|---|
| App shell, offline start, GitHub Pages deploy, brand icons | done; offline start fixed 24 Oct 2026 (the service worker saved almost nothing before); daily update check and "Update now" for parents |
| Setup wizard (birth month + year, school class, language), demo, restore on first start | done |
| Two-layer access control (on/off → earn/open, unlock for today with PIN) | done |
| Forgotten PIN: recovery code, or a reset after 24 hours | done |
| PIN lockout kept in the settings (closing the pad or reloading does not reset it), waits 30 s → 2 min → 10 min → 30 min | done (26 Oct 2026) |
| Device-clock guard: a clock turned back past a time already seen pauses earned time until a parent checks | done (26 Oct 2026); a clock turned forward is only noticed once it goes back (or the real date catches up), and the 24-hour PIN reset can still be shortened that way |
| Review boxes (Leitner): wrong answers come back after 1, 3, 7, 21 days; up to a fifth of each round | done (26 Oct 2026); to watch with children whether a fifth is the right share |
| After a mistake: the right answer with the sum worked out and a reason (parent setting, on by default) | done (26 Oct 2026); reasons written for counting, small times sums, rounding and number patterns; more question types could get their own |
| Typed number answers (every other number question from Stage 1; parent setting) | done (26 Oct 2026) |
| Reports: skill mastery (Known / Practising / Needs help, last 30 days), review-box figures | done (26 Oct 2026) |
| Learning garden on the Learn screen | done (26 Oct 2026) |
| Yoruba: app texts, lessons, facts, places, animals, code breaker; map names from the browser (CLDR), capitals in English | **to verify by a native-speaking teacher before use with children** (draft, 26 Oct 2026); no Yoruba voice on most devices, so nothing is read aloud in Yoruba |
| New name and logo: Becoming Bright Studio, sunrise and sprout (`scripts/make-brand.mjs`) | done (26 Oct 2026) |
| Missions: 10, 25 or 50 questions (parent's choice), one try each (green right / red wrong, the answer never shown), pass mark 70 %, a star per 10 questions, earned time | done |
| Skills ladder by school class (58 skills, Stage 0–6), adaptive within one stage of the class | done |
| Learning streak like Duolingo: days in a row, earned streak freezes, milestones, shown to parents | done |
| Skill-to-stage placement and US / Berlin equivalents | to verify against each curriculum framework |
| Class-to-stage mapping (England Year, US Grade, German Klasse, Nigerian Primary) in `src/lessons/classes.ts` | assumed from the usual ages; to verify |
| German and French app texts (`src/i18n/de.ts`, `fr.ts`) | translated by the developer; to check by native speakers |
| German and French lessons and facts (`src/lessons/text-de.ts`, `text-fr.ts`, `facts.ts`) | translated by the developer, checked by the content test for completeness and one right answer; wording to check by native speakers |
| Animal facts, "Did you know?" facts, capitals, flag colours | second check done 23 Oct 2026 (pictures matched to facts, ambiguous questions fixed); `src/lessons/content.test.ts` checks every question type for exactly one true answer |
| Games: memory, word builder, puzzle, snake, code breaker | done |
| Library: 40 animals and 40 places of the world with real photos (Wikimedia Commons, credited), photo questions in World | done; facts to verify again like all facts |
| World map: tap a country (flag, capital, people, size, languages, money, neighbours), quiz for continents / countries, works offline once opened | done; zoom per continent with 64 px targets for small countries; population World Bank 2024; flags fetched in the background for offline use; facts to verify like all facts; to test on Fire, Android, iPad |
| Reading aloud: round mute button on every screen (and on the parent page), one voice at a time, tap again to stop, stops on leaving | done; to test with the voices on Fire, Android, iPad |
| Media: radio (Die Maus / WDR, Fun Kids, Mon Petit France Inter, Babyradio in Spanish) | to verify: each station's terms for other players (none published); whether Babyradio has adverts |
| Media: story speed (slow, a bit slower, normal) | done |
| Media: video library (how things are made / work, live animal cams; official channels) | done; run `node scripts/check-videos.mjs` before each release (live ids can change) |
| Phone layout (320–390 px, larger text) | done; checked automatically for overflow on every screen |
| Media: LibriVox stories (public domain) | done; recordings are public domain in the USA, to verify per country |
| Media: parent-approved YouTube videos (youtube-nocookie) | done |
| Family calls (tel:, WhatsApp, FaceTime links) | to verify which links open on Fire, Android, iPad |
| Reports (day/week/month, needs help, mistakes) + email via the parent's mail app | done; mailto on Fire to verify |
| Backup / restore + reminder; persistent storage | done; share sheet on iPad and storage on Fire to verify |
| Reading aloud: best voice on the device, parent voice picker | done; voices on Fire to verify |
| Install page (device steps, QR code) | done; Fire and Amazon Kids steps to verify |

## Not possible from the code (needs a person or a device)

- Repository "About" text and topics on GitHub: needs the repository owner (the token has no Administration right).
- Checks on real devices: Amazon Fire voices, Amazon Kids browser, mailto, share sheet, family-call links.
- Terms of use of the radio streams (WDR, Fun Kids, Radio France).
- Native-speaker reading of the German, French and Yoruba texts (Yoruba is a draft).

## v1.1 (plugins, each optional and off by default)

- Recorded voice clips for the fixed words (letters, numbers, animals, fruit) made with an open-source neural
  voice, so reading aloud sounds natural on every device and offline (licence of each voice to check).
- Backup to the parent's own Google Drive (needs a sign-in; to verify).
- Calendar links (needs a small proxy because calendars do not allow browser access).
- Automatic email reports through the parent's own email service.
- AI-made lessons with the parent's own API key.
- School-notices plugin.
- More languages (app texts in `src/i18n/`, lesson texts in `src/lessons/text-*.ts`), e.g. Hausa and Igbo.
- Local examples for each school system (money in naira, pounds, dollars or euros; local places and foods).
- More stories (other public-domain recordings) and stations, after checking their terms.

## v2 (native)

- Native app with alarms and bedtime lock, a toddler mode, and app-store releases.
