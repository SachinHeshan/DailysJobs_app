import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ThemeColors {
  // Backgrounds
  background: string;
  card: string;
  cardHover: string;
  navBar: string;
  filterPanel: string;
  inputBg: string;
  skeleton: string;

  // Borders
  border: string;
  borderLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Primary brand (teal-600)
  primary: string;
  primaryLight: string;
  primaryMuted: string;

  // Chips / tags
  chipBg: string;
  chipBorder: string;
  chipText: string;

  // Dropdowns / modals
  modalBg: string;
  modalItemBg: string;
  modalItemSelectedBg: string;

  // Badges
  categoryBadgeBg: string;
  categoryBadgeBorder: string;
  categoryBadgeText: string;
}

/**
 * LIGHT palette — mirrors website Tailwind tokens:
 *   bg-slate-50/50, bg-white, text-slate-800/700/500,
 *   border-slate-200/100, teal-600 primary
 */
const light: ThemeColors = {
  // slate-50 (#f8fafc) — same as website `--background`
  background: '#f8fafc',
  // white (#ffffff) — same as website `--card` / bg-white
  card: '#ffffff',
  cardHover: '#f8fafc',
  // navbar: bg-white/80 backdrop-blur (website Navbar)
  navBar: 'rgba(255,255,255,0.85)',
  // filter panel: bg-white (website HomeContent search box)
  filterPanel: '#ffffff',
  // input: bg-slate-50/50 (website search/select inputs)
  inputBg: 'rgba(248,250,252,0.5)',
  // skeleton pulse lines: bg-slate-200
  skeleton: '#e2e8f0',

  // border-slate-200 (#e2e8f0) — `--border` in globals.css
  border: '#e2e8f0',
  // border-slate-100 (#f1f5f9) — used for inner dividers
  borderLight: '#f1f5f9',

  // text-slate-800 (#1e293b) for headings, slate-700 for body
  textPrimary: '#1e293b',
  textSecondary: '#334155',
  // text-slate-500 (#64748b) — `--muted-foreground`
  textMuted: '#64748b',

  // teal-600 (#0d9488) — `--primary` in globals.css
  primary: '#0d9488',
  // teal-50 (#f0fdfa) — bg for teal-tinted light containers
  primaryLight: '#f0fdfa',
  primaryMuted: 'rgba(13,148,136,0.08)',

  // chips: bg-white border-slate-200 text-slate-600
  chipBg: '#ffffff',
  chipBorder: '#e2e8f0',
  chipText: '#475569',

  // modals: bg-slate-50, item bg-white, selected bg-teal-50
  modalBg: '#f8fafc',
  modalItemBg: '#ffffff',
  modalItemSelectedBg: '#f0fdfa',

  // category badge: bg-slate-50 border-slate-100 text-slate-600
  categoryBadgeBg: '#f8fafc',
  categoryBadgeBorder: '#f1f5f9',
  categoryBadgeText: '#475569',
};

/**
 * DARK palette — mirrors website Tailwind dark: tokens:
 *   dark:bg-slate-950, dark:bg-slate-900, dark:text-slate-100,
 *   dark:border-slate-800, teal-600 primary unchanged
 */
const dark: ThemeColors = {
  // slate-950 (#020617) — website: dark:bg-slate-950
  background: '#020617',
  // slate-900 (#0f172a) — website: dark:bg-slate-900 (cards, filter panel)
  card: '#0f172a',
  cardHover: '#1e293b',
  // navbar: dark:bg-slate-950/80 (website Navbar)
  navBar: 'rgba(2,6,23,0.85)',
  // filter panel: dark:bg-slate-900 (website search box)
  filterPanel: '#0f172a',
  // input: dark:bg-slate-950 (website search/select inputs)
  inputBg: '#020617',
  // skeleton: dark:bg-slate-800
  skeleton: '#1e293b',

  // border-slate-800 (#1e293b) — website dark: borders
  border: '#1e293b',
  // borderLight: also slate-800 (website uses same for inner dividers)
  borderLight: '#1e293b',

  // text-slate-100 (#f1f5f9) — website dark:text-slate-100
  textPrimary: '#f1f5f9',
  // text-slate-200 (#e2e8f0) — website dark:text-slate-200
  textSecondary: '#e2e8f0',
  // text-slate-400 (#94a3b8) — website dark:text-slate-400
  textMuted: '#94a3b8',

  // teal-600 stays same in dark mode
  primary: '#0d9488',
  // teal-500/10 — teal tint for dark icon backgrounds
  primaryLight: 'rgba(13,148,136,0.10)',
  primaryMuted: 'rgba(13,148,136,0.08)',

  // chips dark: bg-slate-800 border-slate-700 text-slate-300
  chipBg: '#1e293b',
  chipBorder: '#334155',
  chipText: '#cbd5e1',

  // modals dark: bg-slate-950, items bg-slate-900, selected teal/15
  modalBg: '#020617',
  modalItemBg: '#0f172a',
  modalItemSelectedBg: 'rgba(13,148,136,0.15)',

  // category badge dark: bg-slate-800/50 border-slate-800 text-slate-300
  categoryBadgeBg: '#1e293b',
  categoryBadgeBorder: '#1e293b',
  categoryBadgeText: '#cbd5e1',
};

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
  colors: dark,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to dark mode — matches website screenshot & user preference
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? dark : light }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
