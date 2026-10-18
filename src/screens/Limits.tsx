import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { BackLink, Emoji, RoundButton, Screen } from '../components/ui';
import { native, useEngine } from '../engine';
import { minutesLabel } from '../format';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// 19 — daily rules. Every change saves instantly (no Save button).
export function Limits() {
  const nav = useNav();
  const { settings: s } = useEngine();

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Emoji size={56}>⏱️</Emoji>
        <Text style={styles.title}>Limits</Text>
      </View>
      <View style={styles.rows}>
        <Row emoji="📅" title="Every day" sub="All apps together">
          <Stepper
            value={minutesLabel(s.dailyMin)}
            preferredFocus
            onMinus={() => native.setSettings({ dailyMin: clamp(s.dailyMin - 15, 15, 720) })}
            onPlus={() => native.setSettings({ dailyMin: clamp(s.dailyMin + 15, 15, 720) })}
          />
        </Row>
        <Row emoji="📺" title="One sitting" sub="Then a break">
          <Stepper
            value={minutesLabel(s.sessionMin)}
            onMinus={() => native.setSettings({ sessionMin: clamp(s.sessionMin - 5, 5, 240) })}
            onPlus={() => native.setSettings({ sessionMin: clamp(s.sessionMin + 5, 5, 240) })}
          />
        </Row>
        <Row emoji="☕" title="Break" sub="Between sittings">
          <Stepper
            value={s.breakMin ? minutesLabel(s.breakMin) : 'None'}
            onMinus={() => native.setSettings({ breakMin: clamp(s.breakMin - 5, 0, 120) })}
            onPlus={() => native.setSettings({ breakMin: clamp(s.breakMin + 5, 0, 120) })}
          />
        </Row>
        <Row emoji="🌙" title="When time's up" sub="TV off needs accessibility">
          <View style={styles.options}>
            <Option label="Block screen" on={s.whenUp === 'block'} onPress={() => native.setSettings({ whenUp: 'block' })} />
            <Option label="TV off" on={s.whenUp === 'off'} onPress={() => native.setSettings({ whenUp: 'off' })} />
          </View>
        </Row>
      </View>
      <BackLink label="Back to apps" onPress={() => nav.back()} />
    </Screen>
  );
}

function Row({ emoji, title, sub, children }: { emoji: string; title: string; sub: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <View style={styles.rowTitleLine}>
          <Emoji size={44}>{emoji}</Emoji>
          <Text style={styles.rowTitle}>{title}</Text>
        </View>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

function Stepper({
  value,
  onMinus,
  onPlus,
  preferredFocus,
}: {
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  preferredFocus?: boolean;
}) {
  return (
    <View style={styles.stepper}>
      <RoundButton label="−" size={80} variant="raised" fontSize={44} onPress={onMinus} preferredFocus={preferredFocus} />
      <Text style={styles.stepValue}>{value}</Text>
      <RoundButton label="+" size={80} variant="raised" fontSize={44} onPress={onPlus} />
    </View>
  );
}

function Option({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <FocusButton
      variant={on ? 'raised' : 'secondary'}
      onPress={onPress}
      style={[styles.option, !on && styles.optionOff]}
    >
      <Text style={[styles.optionText, { color: on ? colors.mint : colors.textMuted }]}>
        {on ? '●' : '○'} {label}
      </Text>
    </FocusButton>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: px(46) },
  title: { fontFamily: fonts.heavy, fontSize: px(64), color: colors.text, marginLeft: px(14) },
  rows: { marginTop: px(32), gap: px(22) },
  row: {
    height: px(118),
    borderRadius: px(28),
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: px(34),
  },
  rowText: { flex: 1 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontFamily: fonts.heavy, fontSize: px(40), color: colors.text, marginLeft: px(22) },
  rowSub: { fontFamily: fonts.bold, fontSize: px(30), color: colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepValue: {
    width: px(256),
    textAlign: 'center',
    fontFamily: fonts.heavy,
    fontSize: px(44),
    color: colors.mint,
  },
  options: { flexDirection: 'row', gap: px(20) },
  option: { height: px(78), minHeight: 0, borderRadius: px(39), paddingHorizontal: px(34) },
  optionOff: { backgroundColor: colors.surfaceRaised },
  optionText: { fontFamily: fonts.heavy, fontSize: px(36) },
});
