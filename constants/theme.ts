/**
 * Claymorphism Design System Tokens — Health Check App
 * 
 * Aesthetic: Soft 3D, chunky, pillowy tactile surfaces with top-left specular
 * highlights and bottom-right shaded depth, paired with a calm healthcare blue palette.
 * Strictly 0 purple/violet.
 */
import { StyleSheet } from 'react-native';

export const theme = {
  colors: {
    // Primary Clinical Palette
    primary: '#2563eb',
    primaryLight: '#eff6ff',
    primaryDepth: '#1d4ed8',
    primaryShadow: '#1e40af',

    // Canvas & Surfaces
    background: '#f0f7ff', // Soft calming cloud blue canvas
    surface: '#ffffff',
    cardBg: '#ffffff',
    elevatedBg: '#ffffff',

    // Typography
    text: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    textLight: '#94a3b8',

    // Clay Depth Borders (Simulate 3D light source from top-left)
    highlightLight: 'rgba(255, 255, 255, 0.95)',
    highlightSoft: 'rgba(255, 255, 255, 0.60)',
    clayShadeBorder: '#dbeafe', // Soft blue shaded bottom-right border
    clayShadeBorderSubtle: '#e2e8f0',
    claySunkenBorder: '#cbd5e1', // Sunken input top-left inner shade

    // Status Colors
    success: '#16a34a',
    successLight: '#f0fdf4',
    successBorder: '#bbf7d0',
    successDepth: '#86efac',

    warning: '#d97706',
    warningLight: '#fffbeb',
    warningBorder: '#fde68a',
    warningDepth: '#fcd34d',

    danger: '#dc2626',
    dangerLight: '#fef2f2',
    dangerBorder: '#fca5a5',
    dangerDepth: '#f87171',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 36,
  },

  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    title: 32,
  },

  radius: {
    xs: 8,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 28,
    pill: 999,
  },
} as const;

/**
 * Reusable Claymorphism Style Presets for React Native
 */
export const clayStyles = StyleSheet.create({
  // Floating Soft 3D Clay Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.lg,
    padding: 18,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 3,
    borderBottomWidth: 4,
    borderRightColor: '#dbeafe',
    borderBottomColor: '#bfdbfe',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },

  // Smaller / Secondary Clay Tile
  cardCompact: {
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.md,
    padding: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2.5,
    borderBottomWidth: 3.5,
    borderRightColor: '#dbeafe',
    borderBottomColor: '#bfdbfe',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  // Tactile Pillowy Primary Button
  buttonPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
    borderRightWidth: 2.5,
    borderBottomWidth: 4,
    borderRightColor: '#1d4ed8',
    borderBottomColor: '#1e40af',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  // Pillowy Secondary / Tinted Button
  buttonSecondary: {
    backgroundColor: '#eff6ff',
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 2,
    borderBottomWidth: 3.5,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },

  // Sunken / Inset Clay Form Input Field
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: theme.radius.sm + 4,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0f172a',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#cbd5e1',
    borderLeftColor: '#cbd5e1',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightColor: '#ffffff',
    borderBottomColor: '#ffffff',
  },

  // 3D Clay Pill / Badge
  pill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.8)',
    borderRightWidth: 1.5,
    borderBottomWidth: 2.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // 3D Avatar Outer Ring
  avatarCircle: {
    borderRadius: theme.radius.pill,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderRightWidth: 3,
    borderBottomWidth: 4,
    borderRightColor: '#bfdbfe',
    borderBottomColor: '#93c5fd',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
});
