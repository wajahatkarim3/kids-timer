# Progress

Hackathon: Build, Ship, Shape: Amazon Developer Hackathon — Fire TV track.
Deadline: Fri Oct 23, 2026, 12:00 pm PT.

Last updated: 2026-10-19.

## Status

All 33 screens from [screenshots/](screenshots/) are built and the native engine works end to end on the Android TV emulator (`FireTV_API31`, Google TV, API 31, 1920×1080). Not yet run on a real Fire TV Stick.

## Verified on the emulator

| Area | Screens | Result |
| --- | --- | --- |
| Setup | 01, 04–09 | Welcome, accessibility step (flips to "Turned on" live, enabled through TV settings without adb), look-away, secret number, apps, all set. Screens 02–03 dropped: no overlay permission needed |
| Parent lock | 10–12, 25, 29 | Remote number keys, "Not quite — N tries left", badge text per reason, re-lock on reopen |
| Home | 13, 14 | Presets, custom stepper, status line under App auto-start, grown-up banner hides at once, Fix banner → Setup check |
| Grown-up mode | 15, 16 | Choose duration, active screen, turn limits back on |
| Settings | 17–21 | Secret number, apps list (whole rows, row-step scrolling), limits save instantly, usage, setup check |
| Pill | 22–24 | Accessibility overlay (works with "Display over other apps" denied); solid, round dot, ⏸ when paused, pulse in last 5 min, burn-in shift, sits below the TV home clock |
| Sleep timer | 26–28, 30 | Pause / resume / ±5 / stop, screen turns off at zero, Time's up on wake, add time starts a new timer |
| Daily rules | 31–33 | Counts only while a counted app is in front, break screen, re-block during break, Ready → Continue, daily limit |
| Back on blocks | 28, 31–33 | Goes to TV home, never into the blocked app |

## Fixed during testing

- Expo `OnStopObserving` cut the state stream when the lock screen unmounted → timer froze
- Our own overlay counted as "the app in front" → pill hid itself
- Package visibility hid the home app and other apps → wrong foreground detection
- Device-admin request closed silently on Android TV
- Reopening after "Done" showed the old block screen instead of the lock
- Usage chart labels wrapped, Recent rows collided with the back link
- Apps list: half-cut rows, system "Settings"/"Third Party Notices", Kids Timer itself listed
- Pill covered the Google TV clock on the home screen
- Removed Skip and adb help from setup
- Dropped "Display over other apps": the pill is an accessibility overlay, so setup needs one permission (block screens and screen-off verified with the overlay permission denied)

## Open items

1. **Fire TV Stick run.** Accessibility service listing, the pill and screen-off on real Fire OS are unverified. If Fire OS doesn't list third-party accessibility services, parents get stuck at that step.
2. **Break over while away:** "Ready when you are" only shows if the break screen is still open.
3. **Accessibility restart while an app is already open:** counting starts only after the next app switch.
4. **Submission:** demo video (< 3 min, on a real Fire TV), Devpost text, product feedback, friction log (8 entries in [FRICTION_LOG.md](FRICTION_LOG.md)).

## Testing tips

- Fresh start: `adb shell pm clear dev.shipkaro.kidstimer.firetv`, then clear `enabled_accessibility_services`. "Backup TV off" (device admin) survives `pm clear`; turn it off in Setup check.
- After every reinstall, turn the accessibility service back on (see README, Permissions).
- The emulator also has an older prototype (`dev.shipkaro.kidstimer`) installed; it shows up as a second "Kids Timer" in the apps list.

## Change log

- `30d1dc6` feat: draw the pill as an accessibility overlay, one permission
- `80bd016` docs: progress file, permissions section, friction log
- `c3e92ca` fix: leave Kids Timer itself out of the apps list
- `6381ad3` feat: require both permissions, add the Fix banner
- `41fef7a` fix: issues from the earlier prototypes' screenshot runs
- `0b68e68` feat: TV banner and icon, grown-up banner focus, docs
- `5e285cb` fix: usage layout, backup TV off and re-lock after blocks
- `3937ad2` fix: show whole rows in the apps list
- `f08b7ba` fix: keep state events flowing and the pill visible
- `69fc52c` feat: build all screens on top of the native engine
- `c95080f` feat: add native timer engine, countdown pill and app list
- `cd7c114` chore: stop tracking native module build output
- `bc0a0ca` feat: add Kotlin native module with app watch service
- `351fdf8` feat: add design tokens, Nunito fonts and focusable button
- `0ed7443` chore: scaffold Expo 54 + react-native-tvos 0.81 TV app
