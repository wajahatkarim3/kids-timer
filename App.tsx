import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from './src/components/Brand';
import { FocusButton } from './src/components/FocusButton';
import { colors, fonts, px, SAFE_TOP, SAFE_X } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Brand />
      <View style={styles.center}>
        <Text style={styles.title}>Hi! Let's set up Kids Timer</Text>
        <View style={styles.row}>
          <FocusButton label="Let's go ▶" variant="primary" preferredFocus />
          <FocusButton label="Skip" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: px(SAFE_X),
    paddingTop: px(SAFE_TOP),
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.heavy, fontSize: px(84), color: colors.text, marginBottom: px(48) },
  row: { flexDirection: 'row', gap: px(24) },
});
