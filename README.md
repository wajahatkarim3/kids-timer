# Kids Timer

A screen-time timer for Fire TV that kids can't argue with. Parents pick how much TV is allowed; a small countdown pill floats over YouTube, Netflix or any other app; when time runs out the TV turns off or a friendly "Time's up" page appears. Every grown-up action sits behind a parent lock: a simple sum with a secret twist only parents know.

Built with React Native for TV (`react-native-tvos`) and Expo, plus a Kotlin module for the parts that must keep running while kids watch other apps.

Made for the Build, Ship, Shape: Amazon Developer Hackathon (Fire TV track, family entertainment).

- Design and behaviour spec: [PROMPT.md](PROMPT.md) and [screenshots/](screenshots/)
- Developer-experience notes: [FRICTION_LOG.md](FRICTION_LOG.md)
- Status, test log and open items: [PROGRESS.md](PROGRESS.md)

## What it does

| | |
| --- | --- |
| **Sleep timer** | Pick 15 / 30 / 60 minutes or a custom length. It counts down over whatever is on screen and turns the TV off at zero. When the TV wakes, "Time's up" is waiting. |
| **Daily rules** | Apps marked "Counts" share one daily pool (default 2 h), split into sittings (30 min) with breaks (10 min). Time only counts while a counted app is actually on screen. The day resets at local midnight. |
| **Countdown pill** | Solid pill in the top-right corner over any app, with a mint dot and mm:ss. Shows ⏸ when paused, pulses in the last 5 minutes and shifts a few pixels each minute to avoid burn-in. |
| **Block screens** | Take a break → Ready when you are, That's all for today, Time's up. Back goes to the TV home screen, never into the blocked app. |
| **Parent lock** | "What is the sum of A and B?" — the answer is A + B + the secret number. Remote number keys work. Three wrong tries lock the keypad, and each lockout is longer. Lockouts survive closing the app. |
| **Grown-up mode** | Turn every limit off for 2 h, 4 h, until midnight or until turned back on. |
| **Usage** | Today vs. the allowance, per-app time, a 7-day chart and a recent-events feed. 14 days of history, stored only on the TV. |

Everything is driven by the remote: up / down / left / right, OK and Back, with a visible focus ring on every control.

## How it works

```
┌──────────────── React Native (TypeScript) ────────────────┐
│  Screens · tiny stack router · parent lock · focus ring   │
│        ▲ onState (1/s), onDigit           │ functions     │
└────────┼──────────────────────────────────┼───────────────┘
         │                                  ▼
┌──────── modules/kids-timer-native (Kotlin, Expo Modules) ─┐
│  Engine ── ticks every second, owns all rules + storage   │
│    ├─ EngineService   foreground service, restarts on boot│
│    ├─ WatchService    accessibility: app in front, TV off │
│    ├─ PillOverlay     accessibility overlay window        │
│    ├─ AppsRepo        installed TV apps + icons           │
│    └─ AdminReceiver   optional "Backup TV off"            │
└───────────────────────────────────────────────────────────┘
```

- The **engine** lives in Kotlin so the countdown keeps running while the React Native UI is closed. State is saved to SharedPreferences on every change.
- The **pill** is drawn as an accessibility overlay through the watch service, so the app needs no "Display over other apps" permission.
- The **watch service** only treats real activities as "the app in front" (overlays, toasts and our own pill are ignored), so time is counted for the right app.
- When a block is needed, the engine opens Kids Timer on top of the blocked app with the block screen. The screen is turned off with the accessibility service (`GLOBAL_ACTION_LOCK_SCREEN`), or with the optional device admin.

| Part | What |
| --- | --- |
| UI | Expo SDK 54, `react-native-tvos` 0.81, React 19.1, TypeScript, Nunito |
| TV config | `@react-native-tvos/config-tv` (leanback launcher, TV banner, no touchscreen) |
| Native | Local Expo module in [`modules/kids-timer-native`](modules/kids-timer-native) |
| Target | Fire OS (Fire TV Stick); developed on an Android TV emulator |

## Try it

Test builds for a Fire TV Stick are on the [Releases](https://github.com/wajahatkarim3/kids-timer/releases) page (debug-signed, ARM). Sideload the APK with Downloader or `adb install`, then turn on Kids Timer under **Settings › Accessibility**.

## Run it

Requirements: Node 20+, JDK 17, Android SDK (`ANDROID_HOME` set), and an Android TV emulator or a Fire TV Stick with ADB debugging on.

```bash
npm install
npm run prebuild          # generates android/ for a TV build
npm run android           # builds, installs and starts Metro
```

Fire TV Stick: **Settings › My Fire TV › Developer options › ADB debugging** on, then `adb connect <fire-tv-ip>:5555`.

Standalone APK (JS bundled, no Metro needed), as published on Releases:

```bash
cd android
NODE_ENV=production ./gradlew :app:assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
# → android/app/build/outputs/apk/release/app-release.apk
```

### Permissions

Kids Timer needs one permission, and setup won't continue without it (there is no Skip): **Accessibility › Kids Timer**. It lets the app see which app is in front, draw the countdown pill over it, open block screens and turn the TV off. "Open settings" lands on the TV's Accessibility page; Kids Timer is listed under Services.

If it is turned off later, Home shows a "Setup needs a grown-up" banner with **Fix**, which opens Setup check.

Developer shortcut (emulator / debugging only): reinstalling, `am force-stop` or `pm clear` turns the accessibility service off. To turn it back on without clicking through settings:

```bash
adb shell settings put secure enabled_accessibility_services dev.shipkaro.kidstimer.firetv/dev.shipkaro.kidstimer.firetv.a11y.WatchService
adb shell settings put secure accessibility_enabled 1
```

"Backup TV off" (Setup check) is an optional device admin with only the *lock screen* policy. Turn it off from the same row before uninstalling.

## Project layout

```
App.tsx                       entry: fonts, router, re-lock on reopen, engine-driven blocks
src/theme.ts                  colours, fonts, 1920px reference scaling, TV safe margins
src/nav.tsx                   stack router + per-screen Back handling
src/engine.ts                 useEngine() — live engine state
src/components/               FocusButton (focus ring), Screen, chips, steppers…
src/screens/                  one file per screen group (see PROMPT.md screen index)
modules/kids-timer-native/    Kotlin engine, pill, watch service, apps list, receivers
assets/                       app icon, TV banner, splash
```

## License

[MIT](LICENSE)
