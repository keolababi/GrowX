import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';

type ColorMode = 'dark' | 'light';

export type AppModeColors = {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceSoft: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  muted: string;
  primary: string;
  primaryPressed: string;
  ink: string;
  danger: string;
};

type ColorModeContextValue = {
  mode: ColorMode;
  isDark: boolean;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
  /** Generic icon/glyph color: brand green in dark mode, monochrome ink in light mode. */
  iconAccent: string;
  colors: AppModeColors;
};

const STORAGE_KEY = 'growx-color-mode';

const darkColors: AppModeColors = {
  background: '#020B0D',
  surface: '#081713',
  surfaceRaised: '#0D1D19',
  surfaceSoft: '#10251E',
  border: '#233D34',
  borderStrong: '#315447',
  text: '#F4F8F6',
  textSecondary: '#D6DFDB',
  muted: '#899790',
  primary: '#9AF000',
  primaryPressed: '#82CC00',
  ink: '#0B1605',
  danger: '#EF555D',
};

const lightColors: AppModeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceRaised: '#F2F2EF',
  surfaceSoft: '#EAEAE7',
  border: '#D9D9D4',
  borderStrong: '#B9B9B3',
  text: '#111111',
  textSecondary: '#454545',
  muted: '#7A7A76',
  primary: '#8a2be2',
  primaryPressed: '#6e22b5',
  ink: '#FFFFFF',
  danger: '#D94848',
};

const darkVariableValues = {
  '--brand-primary': '154 240 0',
  '--brand-primary-dark': '98 185 0',
  '--brand-accent': '142 232 23',
  '--text-primary': '255 255 255',
  '--text-secondary': '214 219 220',
  '--text-muted': '167 174 176',
  '--background-app': '2 11 13',
  '--background-paper': '8 23 19',
  '--background-raised': '13 29 25',
  '--background-soft': '16 37 30',
  '--border': '35 61 52',
  '--disabled': '38 48 51',
};

const lightVariableValues = {
  '--brand-primary': '138 43 226',
  '--brand-primary-dark': '110 34 181',
  '--brand-accent': '138 43 226',
  '--text-primary': '17 17 17',
  '--text-secondary': '69 69 69',
  '--text-muted': '122 122 118',
  '--background-app': '255 255 255',
  '--background-paper': '255 255 255',
  '--background-raised': '242 242 239',
  '--background-soft': '234 234 231',
  '--border': '217 217 212',
  '--disabled': '224 224 220',
};

const darkVariables = vars(darkVariableValues);
const lightVariables = vars(lightVariableValues);

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>('dark');

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') setModeState(saved);
    });
  }, []);

  const setMode = useCallback((nextMode: ColorMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(STORAGE_KEY, nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = mode;
      document.body.style.backgroundColor = mode === 'dark' ? '#020B0D' : '#FFFFFF';

      const activeVariables = mode === 'dark' ? darkVariableValues : lightVariableValues;
      Object.entries(activeVariables).forEach(([name, value]) => {
        document.documentElement.style.setProperty(name, value);
      });
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      setMode,
      toggleMode,
      iconAccent: mode === 'dark' ? '#9AF000' : '#171717',
      colors: mode === 'dark' ? darkColors : lightColors,
    }),
    [mode, setMode, toggleMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      <View style={[{ flex: 1 }, mode === 'dark' ? darkVariables : lightVariables]}>
        <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
        {children}
      </View>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (!context) throw new Error('useColorMode must be used inside ColorModeProvider');
  return context;
}
