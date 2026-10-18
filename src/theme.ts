// Design tokens taken from screenshots/ (1920x1080 reference).
// The app is laid out in these reference pixels and scaled to the real screen.

import { Dimensions, PixelRatio } from 'react-native';

export const colors = {
  bg: '#0B1311',
  bgDeep: '#080D0C',
  surface: '#161E1C',
  surfaceRaised: '#1B2421',
  surfaceFocused: '#1F2A27',
  mint: '#7FE0B8',
  mintBright: '#93EAC6',
  mintDim: '#1E3A31',
  mintChip: '#18302A',
  text: '#EEF4F1',
  textMuted: '#8E9B96',
  textFaint: '#5E6B66',
  onMint: '#0B1A14',
  amber: '#F4B870',
  amberBright: '#FFCB8A',
  amberChip: '#2A2219',
  amberBorder: '#6E5634',
  red: '#F08A80',
  redSurface: '#2B1E1C',
  inputBorder: '#23352F',
};

export const fonts = {
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

const REF_WIDTH = 1920;

// Reference px -> device independent px. Screens are designed at 1920 wide.
export function px(value: number): number {
  const { width, height } = Dimensions.get('window');
  const w = Math.max(width, height);
  return PixelRatio.roundToNearestPixel((value * w) / REF_WIDTH);
}

// Safe margin from screen edges (TV overscan).
export const SAFE_X = 96;
export const SAFE_TOP = 56;
