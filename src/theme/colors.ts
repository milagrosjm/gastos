import { useColorScheme } from 'react-native';

const light = {
  primary: '#0E9F6E',
  primaryStrong: '#0B7A55', // para botones con texto blanco
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  expense: '#B91C1C',
  income: '#047857',
  warning: '#F59E0B',
};

const dark: typeof light = {
  primary: '#34D399',
  primaryStrong: '#34D399',
  background: '#0F1115',
  surface: '#1A1D23',
  text: '#F3F4F6',
  textMuted: '#9CA3AF',
  border: '#2A2E37',
  expense: '#F87171',
  income: '#34D399',
  warning: '#FBBF24',
};

export type Colors = typeof light;

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? dark : light, isDark };
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { md: 12, lg: 16 };