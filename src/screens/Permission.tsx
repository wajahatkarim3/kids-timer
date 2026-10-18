import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { Emoji, ProgressDots, Screen, StatusChip, Subtitle, Title } from '../components/ui';
import { native } from '../engine';
import { usePermissions } from '../hooks/usePermissions';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';
import { expectExternalReturn } from '../relock';

const PKG = 'dev.shipkaro.kidstimer.firetv';

const KINDS = {
  overlay: {
    step: 0,
    emoji: '📺',
    title: 'Show the timer',
    subtitle: 'Allow “Display over other apps”',
    help: [`adb shell appops set ${PKG} SYSTEM_ALERT_WINDOW allow`],
    open: () => native.openOverlaySettings(),
  },
  accessibility: {
    step: 1,
    emoji: '👀',
    title: 'Spot the app',
    subtitle: 'Accessibility › Kids Timer › On',
    help: [
      `adb shell settings put secure enabled_accessibility_services ${PKG}/${PKG}.a11y.WatchService`,
      'adb shell settings put secure accessibility_enabled 1',
    ],
    open: () => native.openAccessibilitySettings(),
  },
} as const;

// 02–06 — ask for one permission, flip to "Turned on" once granted.
export function Permission({ kind, onNext }: { kind: keyof typeof KINDS; onNext: () => void }) {
  const perms = usePermissions(1000);
  const [help, setHelp] = useState(false);
  const k = KINDS[kind];
  const on = perms[kind];

  return (
    <Screen right={<ProgressDots step={k.step} />}>
      {on ? (
        <View style={styles.bodyOn}>
          <Emoji size={150}>{k.emoji}</Emoji>
          <Title style={styles.titleOn}>{k.title} ✓</Title>
          <View style={styles.chipOn}>
            <StatusChip on />
          </View>
          <FocusButton
            variant="primary"
            preferredFocus
            label="Next ▶"
            onPress={onNext}
            style={styles.next}
            textStyle={styles.nextText}
          />
        </View>
      ) : (
        <View style={[styles.body, help && styles.bodyHelp]}>
          {!help && <Emoji size={160}>{k.emoji}</Emoji>}
          <Title style={styles.title}>{k.title}</Title>
          <Subtitle style={styles.subtitle}>{k.subtitle}</Subtitle>
          <View style={styles.chip}>
            <StatusChip on={false} />
          </View>
          <View style={styles.row}>
            <FocusButton
              variant="primary"
              preferredFocus
              label="Open settings"
              onPress={() => {
                expectExternalReturn();
                k.open();
              }}
              style={styles.open}
              textStyle={styles.openText}
            />
            <FocusButton label="Skip" onPress={onNext} style={styles.skip} textStyle={styles.skipText} />
          </View>
          {help ? (
            <>
              <Text style={styles.helpLead}>From a computer on the same Wi-Fi:</Text>
              <View style={styles.code}>
                {k.help.map((line) => (
                  <Text key={line} style={styles.codeText}>
                    {line}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <FocusButton variant="ghost" onPress={() => setHelp(true)} style={styles.helpLink}>
              {(focused) => <Text style={[styles.helpText, focused && { color: colors.text }]}>Can't find it?</Text>}
            </FocusButton>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', paddingTop: px(92) },
  bodyHelp: { paddingTop: px(150) },
  bodyOn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: px(60) },
  title: { marginTop: px(24) },
  titleOn: { marginTop: px(24) },
  subtitle: { marginTop: px(6) },
  chip: { marginTop: px(48) },
  chipOn: { marginTop: px(40) },
  row: { flexDirection: 'row', alignItems: 'center', gap: px(20), marginTop: px(38) },
  open: { width: px(430), height: px(136), borderRadius: px(44) },
  openText: { fontSize: px(50) },
  skip: { width: px(190), height: px(116), borderRadius: px(36) },
  skipText: { fontSize: px(44) },
  next: { marginTop: px(44), width: px(440), height: px(124), borderRadius: px(40) },
  nextText: { fontSize: px(48) },
  helpLink: { marginTop: px(24), minHeight: px(64), borderRadius: px(32), paddingHorizontal: px(28) },
  helpText: { fontFamily: fonts.bold, fontSize: px(32), color: colors.textMuted },
  helpLead: { fontFamily: fonts.bold, fontSize: px(32), color: colors.textMuted, marginTop: px(30) },
  code: {
    alignSelf: 'stretch',
    marginTop: px(20),
    backgroundColor: colors.surface,
    borderRadius: px(24),
    paddingHorizontal: px(32),
    paddingVertical: px(22),
  },
  codeText: { fontFamily: 'monospace', fontSize: px(29), lineHeight: px(38), color: colors.text },
});
