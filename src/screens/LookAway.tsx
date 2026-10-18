import { StyleSheet, View } from 'react-native';
import { FocusButton } from '../components/FocusButton';
import { Emoji, ProgressDots, Screen, Subtitle, Title } from '../components/ui';
import { useNav } from '../nav';
import { px } from '../theme';

// Shown right before the secret number, so kids aren't watching (spec step 4).
export function LookAway() {
  const nav = useNav();
  return (
    <Screen right={<ProgressDots step={1} />}>
      <View style={styles.body}>
        <Emoji size={160}>🙈</Emoji>
        <Title style={styles.title}>Kids, look away!</Title>
        <Subtitle style={styles.subtitle}>Next is the secret number. Make sure no kids are watching.</Subtitle>
        <FocusButton
          variant="primary"
          preferredFocus
          label="No kids watching ▶"
          onPress={() => nav.replace({ name: 'secret', onboarding: true })}
          style={styles.next}
          textStyle={styles.nextText}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: px(100) },
  title: { marginTop: px(24) },
  subtitle: { marginTop: px(10) },
  next: { marginTop: px(56), height: px(124), paddingHorizontal: px(64), borderRadius: px(40) },
  nextText: { fontSize: px(48) },
});
