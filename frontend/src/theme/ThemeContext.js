import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceScheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceScheme === 'dark');

  // Load saved preference on launch
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('themePreference');
        if (saved !== null) {
          setIsDark(saved === 'dark');
        }
      } catch (err) {
        console.log('Theme load error:', err);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newVal = !isDark;
      setIsDark(newVal);
      await AsyncStorage.setItem('themePreference', newVal ? 'dark' : 'light');
    } catch (err) {
      console.log('Theme save error:', err);
    }
  };

  const theme = {
    isDark,
    colors: isDark ? darkColors : lightColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy access in any screen
export const useTheme = () => useContext(ThemeContext);