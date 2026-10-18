import { StyleSheet, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { Emoji, ProgressDots, Screen, SETUP_STEPS, StatusChip, Subtitle, Title } from '../components/ui';
import { native } from '../engine';
import { usePermissions } from '../hooks/usePermissions';
import { useNav } from '../nav';
import { px } from '../theme';
import { expectExternalReturn } from '../relock';

const KINDS = {
  accessibility: {
    step: 0,
    emoji: '👀',
    title: 'Spot the app',
    subtitle: 'Accessibility › Kids Timer › On',
    open: () => native.openAccessibilitySettings(),
  },
} as const;

// 04–06 — the one permission: accessibility. It lets Kids Timer see the app
// in front, draw the pill over it and turn the TV off. No Skip: nothing works
// without it.
export function Permission({ kind, onNext }: { kind: keyof typeof KINDS; onNext: () => void }) {
  const perms = usePermissions(1000);
  const k = KINDS[kind];
  const on = perms[kind];

  return (
    <Screen right={<ProgressDots step={k.step} total={SETUP_STEPS} />}>
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
        <View style={styles.body}>
          <Emoji size={160}>{k.emoji}</Emoji>
          <Title style={styles.title}>{k.title}</Title>
          <Subtitle style={styles.subtitle}>{k.subtitle}</Subtitle>
          <View style={styles.chip}>
            <StatusChip on={false} />
          </View>
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
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: px(60) },
  bodyOn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: px(60) },
  title: { marginTop: px(24) },
  titleOn: { marginTop: px(24) },
  subtitle: { marginTop: px(6) },
  chip: { marginTop: px(48) },
  chipOn: { marginTop: px(40) },
  open: { marginTop: px(38), width: px(430), height: px(136), borderRadius: px(44) },
  openText: { fontSize: px(50) },
  next: { marginTop: px(44), width: px(440), height: px(124), borderRadius: px(40) },
  nextText: { fontSize: px(48) },
});
