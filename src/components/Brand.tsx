import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, px } from '../theme';

// "● Kids Timer" header shown in the top-left of every screen.
export function Brand() {
  return (
    <View style={styles.row}>
      <View style={styles.glow}>
        <View style={styles.dot} />
      </View>
      <Text style={styles.label}>Kids Timer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  glow: {
    width: px(44),
    height: px(44),
    borderRadius: px(22),
    shadowColor: colors.mint,
    shadowOpacity: 0.6,
    shadowRadius: px(16),
    elevation: 8,
  },
  dot: {
    width: px(44),
    height: px(44),
    borderRadius: px(22),
    backgroundColor: colors.mint,
  },
  label: {
    marginLeft: px(20),
    fontFamily: fonts.heavy,
    fontSize: px(40),
    color: colors.text,
  },
});
