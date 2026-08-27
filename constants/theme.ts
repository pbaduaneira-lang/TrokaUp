export const Colors = {
  light: {
    primary: '#4F46E5', // Indigo moderno e vibrante
    primaryDark: '#3730A3',
    primaryLight: '#818CF8',
    primarySoft: '#EEF2FF',
    secondary: '#0F172A', // Slate escuro premium
    secondaryLight: '#334155',
    accent: '#06B6D4', // Ciano moderno
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    border: '#E2E8F0',
    borderFocus: '#C7D2FE',
    text: '#1E293B',
    textSecondary: '#64748B',
    muted: '#94A3B8',
    success: '#10B981',
    successSoft: '#ECFDF5',
    error: '#EF4444',
    errorSoft: '#FEF2F2',
    warning: '#F59E0B',
    warningSoft: '#FFFBEB',
    tint: '#4F46E5',
    icon: '#64748B',
    overlay: 'rgba(15, 23, 42, 0.6)',
  },
  dark: {
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryLight: '#A5B4FC',
    primarySoft: '#1E1B4B',
    secondary: '#F8FAFC',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSubtle: '#334155',
    border: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    muted: '#64748B',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    tint: '#6366F1',
    icon: '#94A3B8',
    overlay: 'rgba(0, 0, 0, 0.8)',
  }
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const Shadow = {
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  glow: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  }
};

export const Gradients = {
  primary: ['#4F46E5', '#4338CA', '#3730A3'] as const,
  accent: ['#06B6D4', '#3B82F6'] as const,
  dark: ['#1E293B', '#0F172A'] as const,
  cardHighlight: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.4)'] as const,
};
