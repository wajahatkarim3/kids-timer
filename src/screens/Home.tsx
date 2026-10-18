import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { Emoji, RoundButton, Screen, Title } from '../components/ui';
import { native, useEngine } from '../engine';
import { clock, isForever, minutesLabel, msToMin, timeOfDay } from '../format';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

const PRESETS = [15, 30, 60];
const STEP = 5;
const MIN = 5;
const MAX = 240;

function loadMinutes(): number {
  const saved = Number(native.getItem('timerMin'));
  return saved >= MIN && saved <= MAX ? saved : 30;
}

// 13 / 14 — pick a sleep-timer length, or jump to settings.
export function Home() {
  const nav = useNav();
  const state = useEngine();
  const [minutes, setMinutesState] = useState(loadMinutes);
  const [bannerHidden, setBannerHidden] = useState(false);

  const setMinutes = (m: number) => {
    const v = Math.min(MAX, Math.max(MIN, m));
    setMinutesState(v);
    native.setItem('timerMin', String(v));
  };

  const showBanner = state.grownActive && !bannerHidden;
  const status = autoStartStatus(state);

  const header = (
    <>
      <HeaderButton
        label="🎬 Grown-up mode"
        amber
        onPress={() => nav.push({ name: state.grownActive ? 'grownUpActive' : 'grownUp' })}
      />
      <HeaderButton label="📊 Usage" onPress={() => nav.push({ name: 'usage' })} />
      <HeaderButton label="🔑 Secret key" onPress={() => nav.push({ name: 'secret', onboarding: false })} />
      <HeaderButton label="🛡️ Setup check" onPress={() => nav.push({ name: 'setupCheck' })} />
    </>
  );

  return (
    <Screen right={header} style={styles.screen}>
      {showBanner && (
        <View style={styles.banner}>
          <Emoji size={52}>🎬</Emoji>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Grown-up mode is ON</Text>
            <Text style={styles.bannerSub}>
              Limits are off —{' '}
              {isForever(state.grownUntil)
                ? 'watching freely until you turn them back on.'
                : `watching freely until ${timeOfDay(state.grownUntil)}.`}
            </Text>
          </View>
          <FocusButton
            variant="raised"
            preferredFocus
            label="Turn limits back on"
            onPress={() => {
              setBannerHidden(true);
              native.endGrownUp();
            }}
            style={styles.bannerButton}
            textStyle={styles.bannerButtonText}
          />
        </View>
      )}

      <Title style={[styles.title, showBanner && styles.titleCompact]}>How much screen time?</Title>
      {!showBanner && <Text style={styles.subtitle}>Pick a preset, or set your own.</Text>}

      <View style={[styles.presets, showBanner && styles.presetsCompact]}>
        {PRESETS.map((p) => (
          <PresetCard
            key={p}
            minutes={p}
            selected={p === minutes}
            compact={showBanner}
            preferredFocus={!showBanner && p === minutes}
            onPress={() => setMinutes(p)}
          />
        ))}
      </View>

      <View style={[styles.custom, showBanner && styles.customCompact]}>
        <Text style={styles.customLabel}>Custom</Text>
        <RoundButton label="−" size={112} onPress={() => setMinutes(minutes - STEP)} fontSize={60} />
        <View style={styles.customValue}>
          <Text style={styles.customNumber}>{minutes}</Text>
          <Text style={styles.customUnit}>min</Text>
        </View>
        <RoundButton label="+" size={112} onPress={() => setMinutes(minutes + STEP)} fontSize={60} />
      </View>

      <View style={styles.actions}>
        <FocusButton
          variant="primary"
          onPress={() => {
            native.startSleep(minutes);
            native.backToWatching();
          }}
          style={styles.start}
        >
          <Text style={styles.startText}>▶   Start timer</Text>
        </FocusButton>
        <FocusButton onPress={() => nav.push({ name: 'apps', onboarding: false })} style={styles.auto}>
          <View style={styles.autoInner}>
            <Text style={styles.autoText}>⚡ App auto-start</Text>
            <Text style={styles.autoStatus} numberOfLines={1}>
              {status}
            </Text>
          </View>
        </FocusButton>
      </View>
    </Screen>
  );
}

function autoStartStatus(state: ReturnType<typeof useEngine>): string {
  const { day, now, grownActive } = state;
  if (grownActive) return 'Grown-up mode · limits off';
  if (day.breakUntil > now) return `Break until ${timeOfDay(day.breakUntil)}`;
  if (day.sessionMs > 0) {
    const left = Math.min(day.sessionLimitMs - day.sessionMs, day.limitMs - day.usedMs);
    return `Session: ${clock(left)} left`;
  }
  return `${minutesLabel(msToMin(day.usedMs))} of ${minutesLabel(msToMin(day.limitMs))} today`;
}

function HeaderButton({ label, amber, onPress }: { label: string; amber?: boolean; onPress: () => void }) {
  return (
    <FocusButton
      label={label}
      onPress={onPress}
      style={styles.headerButton}
      textStyle={[styles.headerButtonText, amber && { color: colors.amber }]}
    />
  );
}

function PresetCard({
  minutes,
  selected,
  compact,
  preferredFocus,
  onPress,
}: {
  minutes: number;
  selected: boolean;
  compact: boolean;
  preferredFocus: boolean;
  onPress: () => void;
}) {
  return (
    <FocusButton
      onPress={onPress}
      preferredFocus={preferredFocus}
      style={[styles.card, compact && styles.cardCompact, selected && styles.cardSelected]}
    >
      <View style={styles.cardInner}>
        <Text style={[styles.cardNumber, compact && styles.cardNumberCompact]}>{minutes}</Text>
        <Text style={styles.cardUnit}>minutes</Text>
      </View>
      {selected && (
        <View style={styles.check}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
    </FocusButton>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: px(112), paddingTop: px(70) },
  headerButton: { height: px(80), minHeight: 0, borderRadius: px(32), paddingHorizontal: px(28) },
  headerButtonText: { fontSize: px(34) },
  banner: {
    marginTop: px(44),
    height: px(152),
    borderRadius: px(40),
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: px(40),
  },
  bannerText: { flex: 1, marginLeft: px(24) },
  bannerTitle: { fontFamily: fonts.heavy, fontSize: px(42), color: colors.amber },
  bannerSub: { fontFamily: fonts.bold, fontSize: px(30), color: colors.textMuted },
  bannerButton: { height: px(96), minHeight: 0, borderRadius: px(32), backgroundColor: '#111917' },
  bannerButtonText: { fontSize: px(38), color: colors.mint },
  title: { textAlign: 'left', marginTop: px(70) },
  titleCompact: { marginTop: px(28), fontSize: px(72), lineHeight: px(88) },
  subtitle: { fontFamily: fonts.bold, fontSize: px(36), color: colors.textMuted, marginTop: px(8) },
  presets: { flexDirection: 'row', gap: px(32), marginTop: px(40) },
  presetsCompact: { marginTop: px(24) },
  card: { flex: 1, height: px(280), borderRadius: px(40), paddingHorizontal: 0 },
  cardCompact: { height: px(196) },
  cardSelected: { borderColor: colors.mint },
  cardInner: { alignItems: 'center' },
  cardNumber: { fontFamily: fonts.black, fontSize: px(112), lineHeight: px(130), color: colors.text },
  cardNumberCompact: { fontSize: px(88), lineHeight: px(100) },
  cardUnit: { fontFamily: fonts.bold, fontSize: px(36), color: colors.textMuted },
  check: {
    position: 'absolute',
    top: px(20),
    right: px(20),
    width: px(56),
    height: px(56),
    borderRadius: px(28),
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontFamily: fonts.black, fontSize: px(34), color: colors.onMint },
  custom: { flexDirection: 'row', alignItems: 'center', marginTop: px(54), height: px(112) },
  customCompact: { marginTop: px(24) },
  customLabel: { fontFamily: fonts.bold, fontSize: px(36), color: colors.textMuted, marginRight: px(36) },
  customValue: { flexDirection: 'row', alignItems: 'flex-end', width: px(270), justifyContent: 'center' },
  customNumber: { fontFamily: fonts.black, fontSize: px(120), lineHeight: px(130), color: colors.mint },
  customUnit: {
    fontFamily: fonts.bold,
    fontSize: px(40),
    color: colors.textMuted,
    marginLeft: px(14),
    marginBottom: px(14),
  },
  actions: { flexDirection: 'row', gap: px(32), marginTop: px(18) },
  start: { flex: 2, height: px(143), borderRadius: px(40) },
  startText: { fontFamily: fonts.heavy, fontSize: px(56), color: colors.onMint },
  auto: { flex: 1, height: px(143), borderRadius: px(40), paddingHorizontal: px(24) },
  autoInner: { alignItems: 'center' },
  autoText: { fontFamily: fonts.heavy, fontSize: px(42), color: colors.text },
  autoStatus: { fontFamily: fonts.bold, fontSize: px(26), color: colors.textMuted, marginTop: px(2) },
});
