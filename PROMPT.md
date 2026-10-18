# Build "Kids Timer" — a screen-time timer for the TV

## The idea

Kids Timer is an app for a **TV** that is used with a TV remote (up / down / left / right, OK and Back). It helps parents control how much TV their kids watch.

A parent sets how much screen time is allowed. While the kids watch other apps (YouTube, Netflix, cartoons and so on), a small countdown pill floats in the corner of the screen. When time runs out, the TV screen turns off, or a friendly full-screen "Time's up" page blocks watching. Kids can't stop the timer, add time or change settings: every grown-up action sits behind a **parent lock**. The lock is a simple math question with a secret twist that only parents know.

The app is read from the sofa, often by small children. **Pictures first, very few words, big buttons, one main action per screen.**

## Implement the UI exactly as in the screenshots

The `screenshots/` folder holds the design. **Match it exactly**: layout, spacing, sizes, colours, font, emoji, wording, button styles, focus rings, and where each element sits. Don't redesign, add extra text, or "improve" the look. If two screenshots differ slightly in colour or font, use one consistent style across the whole app, taken from the majority of the screens.

Every focusable item needs the visible focus ring shown in the screenshots. Every screen must work with the remote alone, with sensible focus order and a sensible default focus (usually the main button).

## How it works

### Parent lock (screens 10–12, 25, 29)
- The lock asks "What is the sum of A and B?", with A and B random numbers (about 2–19).
- The correct answer is **A + B + the secret number**. Kids can add two numbers but don't know the secret number, so only parents can answer.
- On-screen keypad: 1–9, Clear, 0, Enter. The number keys on the remote also work.
- A wrong answer shows a new question and "Not quite — N tries left" (11). After 3 wrong tries the keypad locks with a countdown, "Too many tries — wait 30s ⏳" (12). Each further lockout lasts longer.
- The small badge above the question says why the lock is shown: "Grown-ups only", "Grown-ups: change the timer", "Parents: add more time".
- Opening the app always asks for the lock first.

### First-time setup (screens 01–09)
1. **Welcome** (01): three picture tiles and "Let's go".
2. **Show the timer** (02 → 03): asks for permission to draw over other apps. It shows "Not on yet" until the permission is granted, then "Turned on" with Next. "Skip" is allowed.
3. **Spot the app** (04 → 06): asks for the accessibility permission, which lets the app see which app is in front and turn the screen off. "Can't find it?" (05) shows the computer commands that turn it on remotely.
4. **Pick a secret number** (07): −10 / − / number / + / +10, with a live example "4 + 5 + 17 = 26" so the parent understands the twist. The default is 17. Before this step, warn the parent that the child must not be watching the screen.
5. **Which apps count?** (08): installed apps, each with an On/Off toggle. "Counts" means it uses screen time; "Free" means it doesn't.
6. **All set!** (09): a summary of the defaults (30 min per session, 10 min break, 2 h a day) and Finish.

Progress dots in the top-right show the current step. If a permission is later turned off, the home screen shows a banner with a "Fix" button that opens Setup check (21).

### Home (screens 13, 14)
- "How much screen time?" with presets of 15 / 30 / 60 minutes and a custom − / + stepper (steps of 5).
- **Start timer** starts a plain **sleep timer**. It counts down whatever is on screen and turns the TV off at zero.
- **App auto-start** opens the apps list. Under its label, a small status line shows today's usage, e.g. "0 min of 2 h today", "Session: 12:30 left" or "Break until 8:40 PM".
- Header buttons: 🎬 Grown-up mode, 📊 Usage, 🔑 Secret key, 🛡 Setup check.
- While grown-up mode is on, a banner appears at the top (14) with "Turn limits back on". Pressing it must hide the banner immediately.

### Daily screen-time rules (screens 18, 19, 31–33)
Apps marked "Counts" share **one daily pool**:
- **Every day**: the total allowed per day (default 2 h).
- **One sitting**: how long a kid can watch in one go (default 30 min). After that comes a break.
- **Break**: the wait between sittings (default 10 min; "None" turns breaks off).
- **When time's up**: show a block screen, or turn the TV off.

Time only counts down **while a counted app is actually on screen**. It pauses when the kid leaves the app and resumes when they come back. When a sitting ends, the "Take a break" screen (31) appears with a countdown; when the break ends, it switches to "Ready when you are" with Continue (32). Skipping a break needs the parent lock. When the daily pool runs out, "That's all for today" (33) appears. Adding time needs the parent lock and gives extra time for today only. Limits are saved instantly, with no Save button (19). The day resets at local midnight.

### Countdown pill (screens 22–24)
- A small rounded pill in the top-right corner, floating over any app, showing a mint dot and mm:ss.
- When paused, it shows an orange ⏸ next to the time (24).
- Its background must be **fully solid**, and the dot a **perfect circle**.
- It gently pulses during the last 5 minutes and shifts by a few pixels every minute to avoid screen burn-in.
- It hides while the app's own screens are open.

### Running sleep timer (screens 25–27)
After the parent lock: a big remaining time, a Running/Paused chip, and the buttons −5 min, Pause/Resume, +5 min, Stop, plus "Back to watching".

### Time's up (screens 28–30)
- When a sleep timer ends, the TV screen turns off. When the TV wakes, "Time's up" shows with Done and Add time.
- Add time → parent lock (29) → "How much more?" with +15 / +30 / +45 / Cancel (30).
- These block screens can't be left with Back. Back goes to the TV's home screen, not into the blocked app.

### Grown-up mode (screens 15, 16)
After the parent lock, the parent can turn off all limits for 2 hours, 4 hours, until midnight, or until turned back on. While it's on, there are no pill, sessions, breaks or blocks. It ends on its own at the chosen time. Screen 16 shows the active state with "Turn limits back on".

### Usage (screen 20)
Today's total against the daily allowance (bar), a per-app list, a 7-day bar chart, and a "Recent" feed of events: session started, break, blocked, timer ended, screen turned off, grown-up mode on/off. Keep 14 days of history, stored only on this TV.

### Other settings
- **Secret number** (17): the same picker as onboarding.
- **Setup check** (21): each permission with its on/off state and a button to open the matching system setting.

## Things to get right that the screenshots show imperfectly
- **Usage (20):** the last "Recent" row is cut in half. Make the list fit or scroll cleanly. Don't cut off app names when there is room.
- **Home (13):** add the small status line under "App auto-start", as described above.
- **Every screen:** never let text overlap or touch buttons at 1920×1080. Keep a safe margin from all screen edges, because TVs crop the edges.

## Screen index
| File | Screen |
|---|---|
| 01 | Welcome |
| 02–03 | Permission: show timer over apps (off / on) |
| 04–06 | Permission: accessibility (off / help / on) |
| 07 | Onboarding: pick secret number |
| 08 | Onboarding: which apps count |
| 09 | Onboarding: all set |
| 10–12 | Parent lock (question / wrong / locked out) |
| 13 | Home |
| 14 | Home with grown-up banner |
| 15–16 | Grown-up mode (choose / active) |
| 17 | Secret number setting |
| 18 | Apps list |
| 19 | Limits |
| 20 | Usage |
| 21 | Setup check |
| 22–24 | Countdown pill (over TV home / over an app / paused close-up) |
| 25 | Parent lock while a timer runs |
| 26–27 | Running timer (running / paused) |
| 28 | Time's up (sleep timer) |
| 29–30 | Add time (lock / picker) |
| 31–32 | Take a break (counting / ready) |
| 33 | That's all for today |
