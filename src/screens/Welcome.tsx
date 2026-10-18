import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { Emoji, Screen, Subtitle, Title } from '../components/ui';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

const TILES = [
  { emoji: '⏰', label: 'Timer on screen' },
  { emoji: '☕', label: 'Breaks' },
  { emoji: '🔒', label: 'Locked for kids' },
];

// 01 — first launch.
export function Welcome() {
  const nav = useNav();
  return (
    <Screen>
      <View style={styles.body}>
        <ClockIcon />
        <Title style={styles.title}>Hi! Let's set up Kids Timer</Title>
        <Subtitle style={styles.subtitle}>2 minutes · grown-ups only</Subtitle>
        <View style={styles.tiles}>
          {TILES.map((t) => (
            <View key={t.label} style={styles.tile}>
              <Emoji size={72}>{t.emoji}</Emoji>
              <Text style={styles.tileLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
        <FocusButton
          variant="primary"
          preferredFocus
          label="Let's go ▶"
          onPress={() => nav.push({ name: 'permA11y' })}
          style={styles.cta}
          textStyle={styles.ctaText}
        />
      </View>
    </Screen>
  );
}

function ClockIcon() {
  return (
    <View style={styles.clock}>
      <View style={[styles.hand, styles.hourHand]} />
      <View style={[styles.hand, styles.minuteHand]} />
    </View>
  );
}

const CLOCK = 220;
const STROKE = 22;

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', paddingTop: px(36) },
  clock: {
    width: px(CLOCK),
    height: px(CLOCK),
    borderRadius: px(CLOCK / 2),
    borderWidth: px(STROKE),
    borderColor: colors.mint,
  },
  hand: {
    position: 'absolute',
    width: px(STROKE),
    borderRadius: px(STROKE / 2),
    backgroundColor: colors.mint,
    left: px((CLOCK - STROKE * 2) / 2 - STROKE / 2),
    transformOrigin: 'bottom',
  },
  hourHand: {
    height: px(78),
    top: px((CLOCK - STROKE * 2) / 2 - 78 + STROKE / 2),
  },
  minuteHand: {
    height: px(72),
    top: px((CLOCK - STROKE * 2) / 2 - 72 + STROKE / 2),
    transform: [{ rotate: '117deg' }],
  },
  title: { marginTop: px(34) },
  subtitle: { marginTop: px(16) },
  tiles: { flexDirection: 'row', gap: px(32), marginTop: px(54) },
  tile: {
    width: px(340),
    height: px(185),
    borderRadius: px(40),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontFamily: fonts.heavy, fontSize: px(32), color: colors.text, marginTop: px(8) },
  cta: { marginTop: px(50), width: px(510), height: px(136), borderRadius: px(44) },
  ctaText: { fontSize: px(48) },
});
