import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { Emoji, Screen, Subtitle, Title } from '../components/ui';
import { native, useEngine } from '../engine';
import { minutesLabel } from '../format';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

// 09 — summary of the defaults, then into the app.
export function AllSet() {
  const nav = useNav();
  const { settings } = useEngine();
  const cards = [
    { value: minutesLabel(settings.sessionMin), label: 'per session' },
    { value: settings.breakMin ? minutesLabel(settings.breakMin) : 'None', label: 'break' },
    { value: minutesLabel(settings.dailyMin), label: 'a day' },
  ];

  return (
    <Screen>
      <View style={styles.body}>
        <Emoji size={170}>🎉</Emoji>
        <Title style={styles.title}>All set!</Title>
        <Subtitle style={styles.subtitle}>Change these any time in Limits</Subtitle>
        <View style={styles.cards}>
          {cards.map((c) => (
            <View key={c.label} style={styles.card}>
              <Text style={styles.value}>{c.value}</Text>
              <Text style={styles.label}>{c.label}</Text>
            </View>
          ))}
        </View>
        <FocusButton
          variant="primary"
          preferredFocus
          label="Finish ▶"
          onPress={() => {
            native.setSettings({ onboarded: true });
            nav.reset({ name: 'home' });
          }}
          style={styles.finish}
          textStyle={styles.finishText}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', paddingTop: px(60) },
  title: { marginTop: px(30) },
  subtitle: { marginTop: px(12) },
  cards: { flexDirection: 'row', gap: px(32), marginTop: px(56) },
  card: {
    width: px(340),
    height: px(178),
    borderRadius: px(40),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.heavy, fontSize: px(64), lineHeight: px(78), color: colors.mint },
  label: { fontFamily: fonts.bold, fontSize: px(34), color: colors.textMuted },
  finish: { marginTop: px(56), width: px(480), height: px(124), borderRadius: px(40) },
  finishText: { fontSize: px(48) },
});
