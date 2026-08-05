import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';

type ColorMode = 'dark' | 'light';

type ColorModeContextValue = {
  mode: ColorMode;
  isDark: boolean;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
  /** Generic (non-brand) icon/glyph color: brand green in dark mode, near-black in light mode. */
  iconAccent: string;
};

const STORAGE_KEY = 'growx-color-mode';

const darkVariables = vars({
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
});

const lightVariables = vars({
  '--brand-primary': '98 185 0',
  '--brand-primary-dark': '70 145 0',
  '--brand-accent': '112 201 0',
  '--text-primary': '13 22 26',
  '--text-secondary': '57 68 72',
  '--text-muted': '104 116 120',
  '--background-app': '247 249 248',
  '--background-paper': '255 255 255',
  '--background-raised': '240 244 242',
  '--background-soft': '231 238 234',
  '--border': '205 216 211',
  '--disabled': '218 225 222',
});

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
      document.body.style.backgroundColor = mode === 'dark' ? '#020B0D' : '#F7F9F8';
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      setMode,
      toggleMode,
      iconAccent: mode === 'dark' ? '#9AF000' : '#0D161A',
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
