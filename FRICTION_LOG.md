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
