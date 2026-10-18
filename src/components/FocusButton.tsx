import { ReactNode, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, fonts, px } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'raised' | 'amber' | 'danger' | 'ghost';

type Props = {
  label?: string;
  children?: ReactNode | ((focused: boolean) => ReactNode);
  onPress?: () => void;
  variant?: ButtonVariant;
  preferredFocus?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  focusedStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onFocus?: () => void;
};

// Remote-friendly button. Focus shows the mint ring + glow from the screenshots;
// filled (primary/amber) buttons brighten and glow instead of drawing a ring.
export function FocusButton({
  label,
  children,
  onPress,
  variant = 'secondary',
  preferredFocus,
  disabled,
  style,
  focusedStyle,
  textStyle,
  onFocus,
}: Props) {
  const [focused, setFocused] = useState(false);
  const v = variants[variant];
  // Fixed-width buttons centre their label; side padding would only squeeze it.
  const fixedWidth = StyleSheet.flatten(style)?.width != null;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      focusable={!disabled}
      hasTVPreferredFocus={preferredFocus}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      style={[
        styles.base,
        fixedWidth && styles.fixed,
        { backgroundColor: focused ? v.bgFocused : v.bg },
        focused && (v.ring ? styles.ring : styles.glow),
        focused && v.glowColor ? { shadowColor: v.glowColor } : null,
        style,
        focused && focusedStyle,
      ]}
    >
      {typeof children === 'function'
        ? children(focused)
        : children ?? (
            <Text
              style={[styles.text, { color: focused && v.fgFocused ? v.fgFocused : v.fg }, textStyle]}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
    </Pressable>
  );
}

const variants: Record<
  ButtonVariant,
  { bg: string; bgFocused: string; fg: string; fgFocused?: string; ring: boolean; glowColor?: string }
> = {
  primary: { bg: colors.mint, bgFocused: colors.mintBright, fg: colors.onMint, ring: false, glowColor: colors.mint },
  secondary: { bg: colors.surface, bgFocused: colors.surfaceFocused, fg: colors.text, ring: true },
  raised: { bg: colors.surfaceRaised, bgFocused: colors.surfaceFocused, fg: colors.text, ring: true },
  amber: { bg: colors.amber, bgFocused: colors.amberBright, fg: '#2A1A06', ring: false, glowColor: colors.amber },
  danger: { bg: colors.redSurface, bgFocused: '#3A2624', fg: colors.red, ring: true },
  ghost: { bg: 'transparent', bgFocused: colors.surface, fg: colors.textMuted, fgFocused: colors.text, ring: false },
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
  fixed: { paddingHorizontal: 0 },
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
