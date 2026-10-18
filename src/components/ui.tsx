import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors, fonts, px, SAFE_TOP, SAFE_X } from '../theme';
import { Brand } from './Brand';
import { FocusButton } from './FocusButton';

// Full-screen page with the brand header. `right` sits at the top-right.
export function Screen({
  children,
  right,
  center,
  style,
  hideBrand,
}: {
  children: ReactNode;
  right?: ReactNode;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
  hideBrand?: boolean;
}) {
  return (
    <View style={[styles.screen, style]}>
      {!hideBrand && (
        <View style={styles.header}>
          <Brand />
          <View style={styles.headerRight}>{right}</View>
        </View>
      )}
      <View style={[styles.body, center && styles.center]}>{children}</View>
    </View>
  );
}

// Soft radial glow behind the block screens (28, 30–33), built from stacked
// translucent ellipses so it needs no extra native gradient library.
const GLOW_LAYERS = Array.from({ length: 14 }, (_, i) => i);

export function BlockScreen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.blockScreen}>
      {GLOW_LAYERS.map((i) => (
        <View
          key={i}
          style={[
            styles.glowLayer,
            { left: `${2 + i * 2.6}%`, right: `${2 + i * 2.6}%`, top: `${-8 + i * 3.4}%`, bottom: `${-8 + i * 3.4}%` },
          ]}
        />
      ))}
      <View style={styles.blockBody}>{children}</View>
    </View>
  );
}

export function Emoji({ children, size, style }: { children: string; size: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontSize: px(size), lineHeight: px(size * 1.2), textAlign: 'center' }, style]}>{children}</Text>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

/** Onboarding progress: done dots, a long active pill, upcoming dim dots. */
export function ProgressDots({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < step && styles.dotDone,
            i === step && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

/** "● Not on yet" (amber) / "✓ Turned on" (mint) */
export function StatusChip({ on }: { on: boolean }) {
  return on ? (
    <View style={[styles.chip, { backgroundColor: colors.mintChip }]}>
      <Text style={[styles.chipText, { color: colors.mint }]}>✓  Turned on</Text>
    </View>
  ) : (
    <View style={[styles.chip, { backgroundColor: colors.amberChip }]}>
      <View style={styles.chipDot} />
      <Text style={[styles.chipText, { color: colors.amber }]}>Not on yet</Text>
    </View>
  );
}

export function Chip({
  children,
  tone,
  style,
}: {
  children: ReactNode;
  tone: 'amber' | 'mint';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.smallChip,
        { backgroundColor: tone === 'amber' ? colors.amberChip : colors.mintChip },
        style,
      ]}
    >
      <Text style={[styles.smallChipText, { color: tone === 'amber' ? colors.amber : colors.mint }]}>
        {children}
      </Text>
    </View>
  );
}

/** Bottom "← Back to setup" link. */
export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.backWrap} pointerEvents="box-none">
      <FocusButton variant="ghost" onPress={onPress} style={styles.backLink}>
        {(focused) => (
          <Text style={[styles.backText, focused && { color: colors.text }]}>
            <Text style={styles.backArrow}>←  </Text>
            {label}
          </Text>
        )}
      </FocusButton>
    </View>
  );
}

/** Round − / + button used by steppers. */
export function RoundButton({
  label,
  size,
  onPress,
  preferredFocus,
  variant = 'secondary',
  fontSize = 56,
}: {
  label: string;
  size: number;
  onPress: () => void;
  preferredFocus?: boolean;
  variant?: 'secondary' | 'raised';
  fontSize?: number;
}) {
  return (
    <FocusButton
      variant={variant}
      label={label}
      onPress={onPress}
      preferredFocus={preferredFocus}
      style={{ width: px(size), height: px(size), minHeight: 0, borderRadius: px(size / 2), paddingHorizontal: 0 }}
      textStyle={{ fontSize: px(fontSize), lineHeight: px(fontSize * 1.1) }}
    />
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: px(SAFE_X),
    paddingTop: px(SAFE_TOP),
  },
  header: {
    height: px(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: px(20) },
  body: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  blockScreen: { flex: 1, backgroundColor: colors.bgDeep },
  glowLayer: {
    position: 'absolute',
    borderRadius: px(2000),
    backgroundColor: '#13221D',
    opacity: 0.11,
  },
  blockBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.heavy,
    fontSize: px(84),
    lineHeight: px(104),
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.bold,
    fontSize: px(38),
    lineHeight: px(50),
    color: colors.textMuted,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: px(16) },
  dot: { width: px(20), height: px(20), borderRadius: px(10), backgroundColor: '#1F2926' },
  dotDone: { backgroundColor: colors.mint },
  dotActive: { width: px(56), backgroundColor: colors.mint },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: px(64),
    paddingHorizontal: px(32),
    borderRadius: px(32),
  },
  chipDot: {
    width: px(16),
    height: px(16),
    borderRadius: px(8),
    backgroundColor: colors.amber,
    marginRight: px(20),
  },
  chipText: { fontFamily: fonts.heavy, fontSize: px(34) },
  smallChip: {
    alignSelf: 'flex-start',
    height: px(58),
    paddingHorizontal: px(30),
    borderRadius: px(29),
    justifyContent: 'center',
  },
  smallChipText: { fontFamily: fonts.heavy, fontSize: px(30) },
  backWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: px(40),
    alignItems: 'center',
  },
  backLink: { minHeight: px(68), paddingHorizontal: px(28), borderRadius: px(34) },
  backText: { fontFamily: fonts.bold, fontSize: px(34), color: colors.textMuted },
  backArrow: { fontSize: px(30) },
});
