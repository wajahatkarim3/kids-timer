import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { BackLink, Chip, Screen } from '../components/ui';
import { native, useEngine } from '../engine';
import { clock } from '../format';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

// 26 / 27 — the sleep timer, after the parent lock.
export function Running() {
  const nav = useNav();
  const { sleep } = useEngine();
  const paused = sleep.paused;

  const chip = paused ? (
    <Chip tone="amber" style={styles.chip}>
      ▮▮ Paused
    </Chip>
  ) : (
    <Chip tone="mint" style={styles.chip}>
      ● Running
    </Chip>
  );

  return (
    <Screen right={chip}>
      <View style={styles.center}>
        <Text style={styles.label}>TIME REMAINING</Text>
        <Text style={styles.time}>{clock(sleep.remainingMs)}</Text>
      </View>
      <View style={styles.buttons}>
        <FocusButton label="– 5 min" onPress={() => native.adjustSleep(-5)} style={styles.side} textStyle={styles.sideText} />
        <FocusButton
          variant="primary"
          preferredFocus
          onPress={() => (paused ? native.resumeSleep() : native.pauseSleep())}
          style={styles.main}
        >
          <Text style={styles.mainText}>{paused ? '▶   Resume' : '▮▮  Pause'}</Text>
        </FocusButton>
        <FocusButton label="+ 5 min" onPress={() => native.adjustSleep(5)} style={styles.side} textStyle={styles.sideText} />
        <FocusButton
          variant="danger"
          label="■ Stop"
          onPress={() => {
            native.stopSleep();
            nav.reset({ name: 'home' });
          }}
          style={styles.side}
          textStyle={styles.sideText}
        />
      </View>
      <BackLink label="Back to watching" onPress={() => native.backToWatching()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: { height: px(58) },
  center: { alignItems: 'center', marginTop: px(176) },
  label: { fontFamily: fonts.heavy, fontSize: px(34), letterSpacing: px(6), color: colors.textMuted },
  time: {
    fontFamily: fonts.black,
    fontSize: px(260),
    lineHeight: px(300),
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  buttons: { flexDirection: 'row', gap: px(20), position: 'absolute', left: 0, right: 0, bottom: px(140) },
  side: { flex: 368, height: px(128), borderRadius: px(40) },
  sideText: { fontSize: px(44) },
  main: { flex: 542, height: px(138), borderRadius: px(40) },
  mainText: { fontFamily: fonts.heavy, fontSize: px(48), color: colors.onMint },
});
