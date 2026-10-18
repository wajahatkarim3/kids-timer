import { StyleSheet, Text, View } from 'react-native';
import type { GrownUpMode } from '../../modules/kids-timer-native';
import { FocusButton } from '../components/FocusButton';
import { BackLink, Emoji, Screen, Subtitle, Title } from '../components/ui';
import { native, useEngine } from '../engine';
import { isForever, timeOfDay } from '../format';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

const OPTIONS: { mode: GrownUpMode; label: string }[] = [
  { mode: '2h', label: '2 hours' },
  { mode: '4h', label: '4 hours' },
  { mode: 'midnight', label: 'Until midnight' },
  { mode: 'forever', label: 'Until I turn off' },
];

// 15 — turn every limit off for a while.
export function GrownUpChooser() {
  const nav = useNav();
  return (
    <Screen style={styles.chooserScreen}>
      <Emoji size={100} style={styles.emoji}>
        🎬
      </Emoji>
      <Title style={styles.title}>Turn off limits for...</Title>
      <Subtitle style={styles.subtitle}>Watch together with no timers. Limits come back automatically.</Subtitle>
      <View style={styles.options}>
        {OPTIONS.map((o, i) => (
          <FocusButton
            key={o.mode}
            variant="amber"
            label={o.label}
            preferredFocus={i === 0}
            onPress={() => {
              native.setGrownUp(o.mode);
              nav.replace({ name: 'grownUpActive' });
            }}
            style={styles.option}
            textStyle={styles.optionText}
          />
        ))}
      </View>
      <FocusButton label="Cancel" onPress={() => nav.back()} style={styles.cancel} textStyle={styles.cancelText} />
    </Screen>
  );
}

// 16 — grown-up mode is on.
export function GrownUpActive() {
  const nav = useNav();
  const { grownUntil, grownActive } = useEngine();
  const until = isForever(grownUntil) ? 'you turn them back on' : timeOfDay(grownUntil);

  return (
    <Screen>
      <View style={styles.activeTitleRow}>
        <Emoji size={66}>🎬</Emoji>
        <Text style={styles.activeTitle}>Grown-up mode is {grownActive ? 'on' : 'off'}</Text>
      </View>
      <Text style={styles.activeSub}>{grownActive ? `Limits are off until ${until}.` : 'Limits are on.'}</Text>
      {grownActive && (
        <FocusButton
          variant="primary"
          preferredFocus
          label="Turn limits back on"
          onPress={() => {
            native.endGrownUp();
            nav.reset({ name: 'home' });
          }}
          style={styles.turnOn}
          textStyle={styles.turnOnText}
        />
      )}
      <BackLink label="Back to setup" onPress={() => nav.reset({ name: 'home' })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chooserScreen: { paddingHorizontal: px(112), paddingTop: px(70) },
  emoji: { textAlign: 'left', marginTop: px(62) },
  title: { textAlign: 'left', fontSize: px(72), lineHeight: px(90), marginTop: px(8) },
  subtitle: { textAlign: 'left', fontFamily: fonts.regular, fontSize: px(36), marginTop: px(6) },
  options: { flexDirection: 'row', gap: px(28), marginTop: px(56) },
  option: { width: px(360), height: px(192), borderRadius: px(36), paddingHorizontal: px(16) },
  optionText: { fontSize: px(40) },
  cancel: { width: px(360), height: px(120), borderRadius: px(36), marginTop: px(170) },
  cancelText: { fontSize: px(40) },
  activeTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: px(46) },
  activeTitle: { fontFamily: fonts.heavy, fontSize: px(64), color: colors.text, marginLeft: px(20) },
  activeSub: { fontFamily: fonts.bold, fontSize: px(34), color: colors.textMuted, marginTop: px(4) },
  turnOn: {
    alignSelf: 'flex-start',
    marginTop: px(34),
    marginLeft: -px(14),
    height: px(130),
    paddingHorizontal: px(58),
    borderRadius: px(48),
  },
  turnOnText: { fontSize: px(46) },
});
