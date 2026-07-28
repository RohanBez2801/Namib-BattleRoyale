/**
 * NBR Design Tokens — "Desert Storm" palette.
 * Inspired by Namibia's landscape: deep desert night, sunset orange,
 * savannah gold, and desert sky blue.
 *
 * Both light and dark keys use the same game palette so the UI
 * always renders the dark game theme regardless of system preference.
 * app.json sets userInterfaceStyle: "dark" to be explicit.
 */

const GAME_PALETTE = {
  // Legacy aliases
  text: '#F0E6D2',
  tint: '#FF6B1A',

  // Surfaces
  background: '#06080F',
  backgroundAlt: '#0D1120',
  foreground: '#F0E6D2',

  // Cards / elevated surfaces
  card: '#111827',
  cardAlt: '#1A2233',
  cardForeground: '#F0E6D2',

  // Primary — Namibian sunset orange
  primary: '#FF6B1A',
  primaryForeground: '#FFFFFF',
  primaryDark: '#CC4D0E',
  primaryGlow: '#FF8C4A',

  // Accent — savannah gold
  accent: '#F5A623',
  accentForeground: '#000000',

  // Secondary — desert sky blue
  secondary: '#1565C0',
  secondaryForeground: '#FFFFFF',

  // Muted / subdued
  muted: '#131C2E',
  mutedForeground: '#8B98B8',

  // Destructive
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',

  // Success — savannah green
  success: '#22C55E',
  successForeground: '#FFFFFF',

  // Warning
  warning: '#EAB308',

  // Borders & inputs
  border: '#1E2A3D',
  input: '#131C2E',
};

const colors = {
  light: GAME_PALETTE,
  dark: GAME_PALETTE,
  radius: 12,
};

export default colors;
