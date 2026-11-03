# Learning contract

One page, written before the code. If a change to the app breaks this page, change the page first, or don't make
the change.

## Who it is for

- **The child:** aged 4 to 12 (first written for 5 to 7, who are just starting to read). **A grown-up gives each
  child an age** (owner's decision, 27 Oct 2026), and the child sees only the skills for their age range: 4–5, 6–7,
  8–9 or 10–12. Every subject has at least **300 different questions for each age range** (checked by a test). They can tap and
  listen; the youngest may not read a full sentence yet, so everything a young child must understand is a picture,
  a number line, or read aloud. **The child chooses which skill to learn** (owner's decision, 27 Oct 2026): first
  a subject, then a skill in teaching order. Nothing is locked. The Learn tab then shows **only the chosen skill**,
  with "Choose another skill" next to it, so the child isn't faced with a page of 171 skills.
- **The parent:** wants ten calm minutes of real practice, and to see afterwards what was hard. They aren't a
  teacher, and they don't want to configure much.

## What one session does

One session is **one skill**, about 5 to 8 minutes:

1. **Teach card.** One picture or number line, one sentence, read aloud. The child taps "I'm ready".
2. **Two guided tries.** The child answers. Right or wrong, the right answer is shown with a one-line reason, and the
   child taps "Next". These don't count.
3. **Five checks.** One try each, then the same kind of reason. A miss stays on screen until the child taps "Next":
   nothing moves on by itself.
4. **Result.** 4 of 5 right: the skill is **mastered** (a tree on the home screen), and the next skill of the same
   subject is suggested. Fewer: "Let's practise this again", and the next session starts again at the teach card.

Numbers are made fresh each time, so a child can't learn the answers by heart. Every question has exactly one right
answer (checked by a test).

## What the parent sees

One parent screen, behind a PIN:

- **A learning report** for each child: today, the last 7 days or the last 30 days. It shows lessons, lessons
  passed, checks right, days in the app, skills learnt, time per area (lessons, games, listen and watch, explore),
  and the questions to practise again with what the child answered. It is made on the device. "Send by email" opens
  the parent's own mail app with the report as text, and nothing is sent otherwise.
- **Off / Open / Earn first for each subject** (owner's decision, 27 Oct 2026). An "earn first" subject opens for
  the day once the child has passed enough lessons that day (2 at first). At first numbers and words are open, and
  patterns, science and French are earn first.
- **Off / Open / Earn first** for every game, radio, stories, videos and explore item. "Earn first" means a passed
  lesson (4 of 5) earns minutes (10 at first) up to a daily limit (45 at first). The clock only runs while an earn-first
  item is open.
- Children (a name and a colour each), language, reading voice, backup and restore, changing the PIN, and
  **Update now** (the app also updates itself once a day, between activities).

## What it will not do

- **No accounts and no server.** Everything stays on this device. A backup is a file the parent keeps.
- **No ads of our own and no tracking.** *Changed by the owner's decision (26 Oct 2026): radio, stories read aloud
  and a small library of checked videos are back.* Each one is Off, Open or Earn first on the grown-ups' screen.
  Videos come from official channels and play inside the app, in a sandboxed YouTube player with no search. One
  radio station (Fun Kids) plays short adverts, and the app says so.
- **No "this locks the iPad".** It's a web app: it works in the browser and doesn't block other apps. Keeping a
  child in one app is a device setting (Guided Access, app pinning), not something this app can do.
- **No 24-hour PIN reset.** A lost PIN is recovered with the recovery code shown at setup **together with the
  grown-up's email address or secret word** (owner's decision, 2 Nov 2026), or by starting again from a backup. The
  email and secret word are stored only as salted hashes; nothing is ever emailed (there is no server).
- **No language that a native speaker hasn't read aloud,** sentence by sentence. *Exception, by the owner's
  decision (27 Oct 2026): version 1 ships English, Deutsch, Français and Yorùbá. German, French and Yoruba are
  machine-checked for completeness but have not yet been read aloud by native speakers. That reading is the next
  step for each of them (ROADMAP.md).*
- **No reward that isn't earned by learning.** Time for games, radio and videos comes from passed lessons when
  the grown-ups set an item to "Earn first". Games train thinking: memory cards made of a learnt skill's questions,
  word builder, code breaker, picture puzzle, number slide, and four reasoning games with levels that start at the
  child's age and rise after each win (mini sudoku, Tower of Hanoi, repeat the pattern, picture logic).

## The session on paper (the demo before the app)

Skill: **add within 5**. Child: Sam, 6.

| Step | Screen shows | Read aloud | Child does | Then |
|---|---|---|---|---|
| Teach | A number line 0–10. A frog sits on 3 and jumps 2 hops to 5. "3 + 2 = 5" | "To add, start at the first number and jump forward. 3 and 2 more: jump from 3, two hops, to 5." | Taps "I'm ready" | Guided try 1 |
| Guided 1 | "2 + 1 = ?" with buttons 2, 3, 4 | "What is 2 plus 1?" | Taps 4 (wrong) | 4 turns red, **3 turns green**, line: "Start at 2, jump 1 → 3." Stays until Sam taps "Next" |
| Guided 2 | "1 + 3 = ?" with buttons 4, 3, 5 | "What is 1 plus 3?" | Taps 4 (right) | 4 turns green, line: "Start at 1, jump 3 → 4." "Next" |
| Check 1–5 | New sums within 5, same layout, "Check 1 of 5" | Each question | One tap each | Green or red plus the reason, then "Next". Misses are saved for the parent |
| Result | 4 of 5: a sprout grows into a tree. "You've learnt: add within 5!" | The same | Taps "Back home" | "You earned 10 minutes" (for the items set to Earn first) |
| Parent | Report, Today: 1 lesson, 80 % right. To practise again: "2 + 1 = ?: answered 4, right answer 3" | – | Reads it | Can talk about it with Sam at dinner |

If this table can't be acted out with a child and a sheet of paper, the app shouldn't be built that way.

## The skills

Version 1 started with twelve (count to 5 and 10, one more, one less, add and take away within 5 and 10, which is
bigger, first sounds, "a" or "an", rhyming pictures). The owner then asked for the original's other skills, rebuilt in
this format (57). Then the owner asked for science, French and more English, and for ages 4 to 12 with 300
questions per subject and age range: **171 in all**, from Cambridge Primary early years to about Stage 7.

- **Numbers (31):** counting, adding and taking away up to 1000, tens and ones, times tables, time, place value,
  rounding, dividing, multiplying, fractions, percentages, order of operations, square numbers.
- **Sounds and words (47, taught in English):** from letter names, first sounds and naming pictures (4–5), through
  spelling, punctuation, pronouns and prepositions (6–9), to idioms, figurative language, the passive, formal
  language, Greek and Latin roots, clauses, tenses and spelling rules (10–12).
- **Patterns (13):** picture patterns and number sequences, up to steps of 250 and growing patterns.
- **Science (40, in every app language):** 10 per age range, from my body, senses, weather and floating (4–5) to
  body systems, evolution, classification, changes of materials, the solar system, forces, light, circuits and
  ecosystems (10–12).
- **French (40, taught in English):** 10 per age range, from greetings, colours and numbers (4–5) to the near future,
  the passé composé, reflexive verbs, negation and reading short sentences (10–12). *Changed by the owner's decision
  (27 Oct 2026): French was taught in French; it is now taught in English with French answers.*

Science, French and the newer English skills are question banks: questions written by hand with one right answer
each (checked by a test), rather than numbers made fresh.

**Explore** (not lessons): places of the world (real photos with credits), "Did you know?" facts, and **500 Whys**
(short answers to everyday questions in ten topics: the body, nature, the sky, things around us, food, getting
around, our planet, people and feelings, history and inventions, play and sport). **Stories:** at least 50
public-domain recordings for each age range (LibriVox), chosen by hand. Like all facts, they are
to be checked against a source again before a wider release (ROADMAP.md).
