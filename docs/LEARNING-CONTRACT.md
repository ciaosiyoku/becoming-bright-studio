# Learning contract

One page, written before the code. If a change to the app breaks this page, change the page first, or don't make
the change.

## Who it is for

- **The child:** aged 5 to 7, just starting to read. They can tap and listen, and they may not read a full
  sentence yet. Everything a child must understand is a picture, a number line, or read aloud.
- **The parent:** wants ten calm minutes of real practice, and to see afterwards what was hard. They aren't a
  teacher, and they don't want to configure much.

## What one session does

One session is **one skill**, about 5 to 8 minutes:

1. **Teach card.** One picture or number line, one sentence, read aloud. The child taps "I'm ready".
2. **Two guided tries.** The child answers. Right or wrong, the right answer is shown with a one-line reason, and the
   child taps "Next". These don't count.
3. **Five checks.** One try each, then the same kind of reason. A miss stays on screen until the child taps "Next":
   nothing moves on by itself.
4. **Result.** 4 of 5 right: the skill is **mastered** and the next one opens. Fewer: "Let's practise this again",
   and the next session starts again at the teach card.

Numbers are made fresh each time, so a child can't learn the answers by heart. Every question has exactly one right
answer (checked by a test).

## What the parent sees

One parent screen, behind a PIN:

- **Today's misses**, each with the question, what the child answered, and the right answer.
- Which skills each child has mastered.
- A switch: **games allowed** (off at first). When it's on, a mastered skill unlocks a 5-minute memory game made of
  the same pictures.
- Children (a name and a colour each), backup and restore, and changing the PIN.

## What it will not do

- **No accounts and no server.** Everything stays on this device. A backup is a file the parent keeps.
- **No YouTube and no video.** No radio, no map, no ads, no tracking.
- **No "this locks the iPad".** It's a web app: it works in the browser and doesn't block other apps. Keeping a
  child in one app is a device setting (Guided Access, app pinning), not something this app can do.
- **No 24-hour PIN reset.** A lost PIN is recovered with the recovery code shown at setup, or by starting again
  from a backup.
- **No language that a native speaker hasn't read aloud,** sentence by sentence. *Exception, by the owner's
  decision (27 Oct 2026): version 1 ships English, Deutsch, Français and Yorùbá. German, French and Yoruba are
  machine-checked for completeness but have not yet been read aloud by native speakers. That reading is the next
  step for each of them (ROADMAP.md).*
- **No reward that isn't learning-shaped.** The only reward is a short game made of the lesson's own pictures.

## The session on paper (the demo before the app)

Skill: **add within 5**. Child: Sam, 6.

| Step | Screen shows | Read aloud | Child does | Then |
|---|---|---|---|---|
| Teach | A number line 0–10. A frog sits on 3 and jumps 2 hops to 5. "3 + 2 = 5" | "To add, start at the first number and jump forward. 3 and 2 more: jump from 3, two hops, to 5." | Taps "I'm ready" | Guided try 1 |
| Guided 1 | "2 + 1 = ?" with buttons 2, 3, 4 | "What is 2 plus 1?" | Taps 4 (wrong) | 4 turns red, **3 turns green**, line: "Start at 2, jump 1 → 3." Stays until Sam taps "Next" |
| Guided 2 | "1 + 3 = ?" with buttons 4, 3, 5 | "What is 1 plus 3?" | Taps 4 (right) | 4 turns green, line: "Start at 1, jump 3 → 4." "Next" |
| Check 1–5 | New sums within 5, same layout, "Check 1 of 5" | Each question | One tap each | Green or red plus the reason, then "Next". Misses are saved for the parent |
| Result | 4 of 5: a sprout grows into a tree. "You've learnt: add within 5!" | The same | Taps "Back home" | "Add within 10" is now open. If games are allowed: "Memory game unlocked (5 minutes)" |
| Parent | Today's misses: "2 + 1 = ?: answered 4, right answer 3" | – | Reads it | Can talk about it with Sam at dinner |

If this table can't be acted out with a child and a sheet of paper, the app shouldn't be built that way.

## The twelve skills of version 1

Count to 5 · Count to 10 · One more · One less · Add within 5 · Add within 10 · Take away within 5 ·
Take away within 10 · Which is bigger? · First sounds · "a" or "an" · Rhyming pictures.

No capitals or countries: version 1 contains no facts that would need checking against a source.
