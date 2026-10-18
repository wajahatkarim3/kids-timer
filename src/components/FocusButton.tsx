import { ReactNode, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, fonts, px } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost';

type Props = {
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  preferredFocus?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onFocus?: () => void;
};

// Remote-friendly button. Focus shows the mint ring + glow from the screenshots;
// primary buttons brighten instead of drawing a ring.
export function FocusButton({
  label,
  children,
  onPress,
  variant = 'secondary',
  preferredFocus,
  disabled,
  style,
  textStyle,
  onFocus,
}: Props) {
  const [focused, setFocused] = useState(false);
  const v = variants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hasTVPreferredFocus={preferredFocus}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      style={[
        styles.base,
        { backgroundColor: focused ? v.bgFocused : v.bg },
        focused && (v.ring ? styles.ring : styles.glow),
        focused && v.glowColor ? { shadowColor: v.glowColor } : null,
        style,
      ]}
    >
      {children ?? (
        <Text style={[styles.text, { color: v.fg }, textStyle]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const variants: Record<
  ButtonVariant,
  { bg: string; bgFocused: string; fg: string; ring: boolean; glowColor?: string }
> = {
  primary: { bg: colors.mint, bgFocused: colors.mintBright, fg: colors.onMint, ring: false, glowColor: colors.mint },
  secondary: { bg: colors.surface, bgFocused: colors.surfaceFocused, fg: colors.text, ring: true },
  amber: { bg: colors.amber, bgFocused: colors.amberBright, fg: '#2A1A06', ring: false, glowColor: colors.amber },
  danger: { bg: colors.redSurface, bgFocused: '#3A2624', fg: colors.red, ring: true },
  ghost: { bg: 'transparent', bgFocused: colors.surface, fg: colors.textMuted, ring: false },
};

const styles = StyleSheet.create({
  base: {
    minHeight: px(96),
    paddingHorizontal: px(48),
    borderRadius: px(40),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: px(4),
    borderColor: 'transparent',
  },
  ring: {
    borderColor: colors.mint,
    shadowColor: colors.mint,
    shadowOpacity: 0.5,
    shadowRadius: px(18),
    elevation: 10,
  },
  glow: {
    transform: [{ scale: 1.04 }],
    shadowOpacity: 0.55,
    shadowRadius: px(20),
    elevation: 12,
  },
  text: {
    fontFamily: fonts.heavy,
    fontSize: px(44),
  },
});
