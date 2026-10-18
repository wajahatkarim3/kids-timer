# Progress

Hackathon: Build, Ship, Shape: Amazon Developer Hackathon — Fire TV track.
Deadline: Fri Oct 23, 2026, 12:00 pm PT.

Last updated: 2026-10-19.

## Status

All 33 screens from [screenshots/](screenshots/) are built and the native engine works end to end on the Android TV emulator (`FireTV_API31`, Google TV, API 31, 1920×1080). Not yet run on a real Fire TV Stick.

## Verified on the emulator

| Area | Screens | Result |
| --- | --- | --- |
| Setup | 01–09 | Welcome, both permission steps (flip to "Turned on" live), look-away, secret number, apps, all set |
| Parent lock | 10–12, 25, 29 | Remote number keys, "Not quite — N tries left", badge text per reason, re-lock on reopen |
| Home | 13, 14 | Presets, custom stepper, status line under App auto-start, grown-up banner hides at once, Fix banner* |
| Grown-up mode | 15, 16 | Choose duration, active screen, turn limits back on |
| Settings | 17–21 | Secret number, apps list (whole rows, row-step scrolling), limits save instantly, usage, setup check |
| Pill | 22–24 | Solid, round dot, ⏸ when paused, pulse in last 5 min, burn-in shift, sits below the TV home clock |
| Sleep timer | 26–28, 30 | Pause / resume / ±5 / stop, screen turns off at zero, Time's up on wake, add time starts a new timer |
| Daily rules | 31–33 | Counts only while a counted app is in front, break screen, re-block during break, Ready → Continue, daily limit |
| Back on blocks | 28, 31–33 | Goes to TV home, never into the blocked app |

\* The Fix banner compiles and is wired, but hasn't been seen on screen yet (needs a permission turned off after setup).

## Fixed during testing

- Expo `OnStopObserving` cut the state stream when the lock screen unmounted → timer froze
- Our own overlay counted as "the app in front" → pill hid itself
- Package visibility hid the home app and other apps → wrong foreground detection
- Device-admin request closed silently on Android TV
- Reopening after "Done" showed the old block screen instead of the lock
- Usage chart labels wrapped, Recent rows collided with the back link
- Apps list: half-cut rows, system "Settings"/"Third Party Notices", Kids Timer itself listed
- Pill covered the Google TV clock on the home screen
- Removed Skip and adb help from setup (both permissions are required)

## Open items

1. **Fire TV Stick run.** Overlay toggle, accessibility service listing and screen-off on real Fire OS are unverified. If Fire OS hides either setting, parents get stuck at that step.
2. **Optional: drop the overlay permission.** Draw the pill as an accessibility overlay so setup needs only one permission.
3. **Break over while away:** "Ready when you are" only shows if the break screen is still open.
4. **Accessibility restart while an app is already open:** counting starts only after the next app switch.
5. **Submission:** demo video (< 3 min, on a real Fire TV), Devpost text, product feedback, friction log (8 entries in [FRICTION_LOG.md](FRICTION_LOG.md)).

## Testing tips

- Fresh start: `adb shell pm clear dev.shipkaro.kidstimer.firetv`, then set the overlay app-op back to `default` and clear `enabled_accessibility_services`.
- After every reinstall, turn the accessibility service back on (see README, Permissions).
- The emulator also has an older prototype (`dev.shipkaro.kidstimer`) installed; it shows up as a second "Kids Timer" in the apps list.
