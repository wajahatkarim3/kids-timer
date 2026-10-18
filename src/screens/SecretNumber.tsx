import { StyleSheet, Text, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { BackLink, Emoji, ProgressDots, RoundButton, Screen, Subtitle, Title } from '../components/ui';
import { native, useEngine } from '../engine';
import { useNav } from '../nav';
import { colors, fonts, px } from '../theme';

const MIN = 1;
const MAX = 99;

// 07 (onboarding) and 17 (settings) — the secret twist added to every lock answer.
export function SecretNumber({ onboarding }: { onboarding: boolean }) {
  const nav = useNav();
  const { settings } = useEngine();
  const secret = settings.secret;
  const set = (n: number) => native.setSettings({ secret: Math.min(MAX, Math.max(MIN, n)) });

  return (
    <Screen right={onboarding ? <ProgressDots step={1} /> : undefined}>
      <View style={[styles.body, !onboarding && styles.bodySettings]}>
        <Emoji size={150}>🔑</Emoji>
        <Title style={styles.title}>Pick a secret number</Title>
        <Subtitle style={styles.subtitle}>Shh — only grown-ups know it 🤫</Subtitle>
        <View style={styles.row}>
          <FocusButton
            variant="secondary"
            label="−10"
            onPress={() => set(secret - 10)}
            style={styles.ten}
            textStyle={styles.tenText}
          />
          <RoundButton label="−" size={126} onPress={() => set(secret - 1)} preferredFocus fontSize={64} />
          <View style={styles.valueBox}>
            <Text style={styles.value}>{secret}</Text>
          </View>
          <RoundButton label="+" size={112} onPress={() => set(secret + 1)} fontSize={64} />
          <FocusButton
            variant="secondary"
            label="+10"
            onPress={() => set(secret + 10)}
            style={styles.ten}
            textStyle={styles.tenText}
          />
        </View>
        <Text style={styles.example}>
          <Text style={styles.exampleDim}>4 + 5 + </Text>
          <Text style={styles.exampleSecret}>{secret}</Text>
          <Text> = {9 + secret}</Text>
        </Text>
        {onboarding && (
          <FocusButton
            variant="primary"
            label="Next ▶"
            onPress={() => nav.push({ name: 'apps', onboarding: true })}
            style={styles.next}
            textStyle={styles.nextText}
          />
        )}
      </View>
      {!onboarding && <BackLink label="Back to setup" onPress={() => nav.back()} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', paddingTop: px(26) },
  bodySettings: { paddingTop: px(92) },
  title: { marginTop: px(20) },
  subtitle: { marginTop: px(10) },
  row: { flexDirection: 'row', alignItems: 'center', gap: px(28), marginTop: px(40) },
  ten: { width: px(116), height: px(70), minHeight: 0, borderRadius: px(35), paddingHorizontal: 0 },
  tenText: { fontSize: px(30) },
  valueBox: {
    width: px(300),
    height: px(168),
    borderRadius: px(32),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.black, fontSize: px(120), lineHeight: px(140), color: colors.mint },
  example: { fontFamily: fonts.heavy, fontSize: px(56), color: colors.text, marginTop: px(36) },
  exampleDim: { color: colors.textMuted },
  exampleSecret: { color: colors.mint },
  next: { marginTop: px(48), width: px(440), height: px(124), borderRadius: px(40) },
  nextText: { fontSize: px(48) },
});
