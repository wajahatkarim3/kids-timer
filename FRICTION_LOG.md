# Friction log

Notes on developer-experience friction hit while building Kids Timer for Fire TV.
Each entry: task, steps, expected vs. actual, severity, workaround, suggestion.

## 1. Sample's `@react-native-tvos/config-tv` version fails to install on Expo 54

- **Task:** Start a Fire OS app on the same stack as `AmazonAppDev/react-native-multi-tv-app-sample` (`apps/expo-multi-tv`).
- **Steps:** Copied its dependency set (`expo ~54.0.0`, `@react-native-tvos/config-tv ^0.0.10`) into a fresh project and ran `npm install`.
- **Expected:** Clean install, since the sample uses the same versions.
- **Actual:** `ERESOLVE` — `peer expo@"^51" from @react-native-tvos/config-tv@0.0.10`. The sample only installs because it uses Yarn workspaces, which don't enforce peers the same way.
- **Severity:** Medium (blocks first install with npm).
- **Workaround:** Use `@react-native-tvos/config-tv@^0.1.7` (peer `expo >=52`).
- **Suggestion:** Bump `config-tv` in the sample so it can be copied into a standalone npm project.

## 2. `react-native-tvos@~0.81.0-0` resolves to a release candidate

- **Task:** Pin React Native for TV to the 0.81 line used by the sample.
- **Steps:** Used the sample's spec `"react-native": "npm:react-native-tvos@~0.81.0-0"`.
- **Expected:** Latest stable 0.81 build (`0.81.5-2`).
- **Actual:** npm installed `0.81.0-0rc5`. Under semver, a prerelease range only matches prereleases of the same `major.minor.patch`, so `0.81.5-2` is never picked.
- **Severity:** Medium (silently ships an RC).
- **Workaround:** Pin exactly: `npm:react-native-tvos@0.81.5-2`.
- **Suggestion:** Pin an exact version in the sample, or document that `-0` ranges stay on `0.81.0` prereleases.

## 3. `create-expo-module` can't scaffold a local module on Expo 54

- **Task:** Add a local Kotlin module (timer engine, overlay, accessibility service) next to the TV app.
- **Steps:** `npx create-expo-module@latest kids-timer-native --local …`, then the `@sdk-54` tag.
- **Expected:** A local module template that matches the SDK.
- **Actual:** `@latest` refuses ("generates native code that needs Expo SDK 56 or later") and suggests `@sdk-55`; the `@sdk-54` tag predates the non-interactive flags (`error: unknown option '-p'`).
- **Severity:** Low.
- **Workaround:** Wrote `expo-module.config.json`, `android/build.gradle` and the module by hand, copying an SDK 54 module's layout.
- **Suggestion:** Keep the `sdk-N` tags in sync with the flags, or point to the right tag for the installed SDK.

## 4. `OnStopObserving` cuts unrelated event streams

- **Task:** Push engine state to JS every second (`onState`) and remote number keys (`onDigit`).
- **Steps:** Registered the engine listener in `OnStartObserving` and removed it in `OnStopObserving`.
- **Expected:** Removing the last `onDigit` listener leaves `onState` alone.
- **Actual:** When the parent-lock screen unmounted (dropping its `onDigit` listener), `OnStopObserving` fired and state updates stopped; the running timer froze on screen.
- **Severity:** High (silent; looks like a frozen UI).
- **Workaround:** Register the native listener for the module's lifetime (`OnCreate` / `OnDestroy`).
- **Suggestion:** Document that the module-level observing hooks are not per event, or pass the event name.

## 5. Accessibility "window changed" events include overlays

- **Task:** Know which app is in front on Fire OS to count screen time.
- **Steps:** Tracked `TYPE_WINDOW_STATE_CHANGED` package names in an `AccessibilityService`.
- **Expected:** Package of the foreground activity.
- **Actual:** Our own overlay pill (and toasts/dialogs) fire the same event, so the app thought Kids Timer was in front and hid the pill. Checking `getActivityInfo` fixes that, but Android 11+ package visibility makes it fail for apps we can't see.
- **Severity:** Medium.
- **Workaround:** Accept only events whose class is an activity; when the package isn't visible, reject plain `android.widget.*` / `android.view.*` classes.
- **Suggestion:** A Fire OS doc on "detect the app in front" for parental-control / companion apps would help.

## 6. Device admin request silently closes on Android TV

- **Task:** Optional "Backup TV off" via `DevicePolicyManager.lockNow()`.
- **Steps:** Started `ACTION_ADD_DEVICE_ADMIN` with `FLAG_ACTIVITY_NEW_TASK`.
- **Expected:** The activation screen.
- **Actual:** Nothing visible; TV Settings' `DeviceAdminAdd` finishes when it can't identify the caller, and the Settings task underneath came to the front instead.
- **Severity:** Medium.
- **Workaround:** `startActivityForResult` from our own activity.
- **Suggestion:** Note this in the TV/Fire OS device-admin docs.
