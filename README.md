# Kids Timer

A screen-time timer for Fire TV, built with React Native for TV (`react-native-tvos`) and Expo, plus a small Kotlin module for the parts that must keep running while kids watch other apps.

Work in progress for the Build, Ship, Shape: Amazon Developer Hackathon (Fire TV track).

- Design and behaviour spec: [PROMPT.md](PROMPT.md) and [screenshots/](screenshots/)
- Developer-experience notes: [FRICTION_LOG.md](FRICTION_LOG.md)

## Stack

| Part | What |
| --- | --- |
| UI | Expo SDK 54, `react-native-tvos` 0.81, React 19.1, TypeScript, Nunito |
| TV config | `@react-native-tvos/config-tv` (leanback launcher, no touchscreen) |
| Native | Local Expo module in [`modules/kids-timer-native`](modules/kids-timer-native) (Kotlin) |
| Target | Fire OS (Fire TV Stick), Android TV emulator for development |

The native module owns:

- **WatchService** – an accessibility service that reports which app is on screen (and, later, turns the screen off).
- **Permission helpers** – checks for "Display over other apps" and the accessibility service, and opens the matching system settings.

## Run it

Requirements: Node 20+, JDK 17, Android SDK (`ANDROID_HOME` set), an Android TV emulator or a Fire TV Stick with ADB debugging on.

```bash
npm install
npm run prebuild          # generates android/ for a TV build
npm run android           # builds, installs and starts Metro
```

To connect a Fire TV Stick: enable **Settings › My Fire TV › Developer options › ADB debugging**, then `adb connect <fire-tv-ip>:5555`.

### Turn on permissions from a computer

Fire OS can hide these settings screens. Over ADB:

```bash
adb shell appops set dev.shipkaro.kidstimer.firetv SYSTEM_ALERT_WINDOW allow
adb shell settings put secure enabled_accessibility_services dev.shipkaro.kidstimer.firetv/dev.shipkaro.kidstimer.firetv.a11y.WatchService
adb shell settings put secure accessibility_enabled 1
```

Note: `adb shell am force-stop` on the app clears the enabled accessibility service. Re-run the two `settings put` lines after a force-stop.

## Project layout

```
App.tsx                     app entry (fonts, root screen)
src/theme.ts                colours, fonts, 1920px reference scaling, TV safe margins
src/components/             Brand header, FocusButton (remote focus ring)
src/hooks/                  usePermissions (live permission state)
modules/kids-timer-native/  Kotlin Expo module + accessibility service
```

## License

[MIT](LICENSE)
