import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../utils/theme';
import { logUserAction, logger } from '../utils/logger';

/**
 * Theme modes supported by the app
 */
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

const ThemeContext = createContext({
  theme: lightTheme,
  themeMode: THEME_MODES.SYSTEM,
  isDark: false,
  setThemeMode: () => {},
});

/**
 * ThemeProvider manages theme state and persistence
 * Supports light, dark, and system theme modes
 * Integrates with React Native Paper for material design
 */
export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState(THEME_MODES.SYSTEM);
  const [isLoading, setIsLoading] = useState(true);
  const [systemTheme, setSystemTheme] = useState(null);

  // Get system color scheme using useColorScheme hook
  useEffect(() => {
    const getSystemTheme = async () => {
      try {
        // Use useColorScheme as primary source (more reliable)
        console.log('useColorScheme result:', systemColorScheme);
        setSystemTheme(systemColorScheme);
      } catch (error) {
        console.warn('Failed to get system theme info:', error);
        // Fallback to just using the system color scheme
        setSystemTheme(systemColorScheme);
      }
    };

    getSystemTheme();
  }, [systemColorScheme]);

  // Determine if dark mode should be active
  // Use systemTheme if available, fallback to systemColorScheme
  const effectiveSystemScheme = systemTheme || systemColorScheme;
  const isDark = themeMode === THEME_MODES.DARK || 
    (themeMode === THEME_MODES.SYSTEM && effectiveSystemScheme === 'dark');

  // Get the current theme object
  const theme = isDark ? darkTheme : lightTheme;

  // Debug logging for theme state
  useEffect(() => {
    console.log('Theme state update:', {
      themeMode,
      systemColorScheme,
      systemTheme,
      effectiveSystemScheme,
      isDark,
      isLoading
    });
  }, [themeMode, systemColorScheme, systemTheme, effectiveSystemScheme, isDark, isLoading]);

  /**
   * Load saved theme preference from AsyncStorage
   */
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        console.log('Loading saved theme mode:', savedThemeMode);
        
        if (savedThemeMode && Object.values(THEME_MODES).includes(savedThemeMode)) {
          setThemeModeState(savedThemeMode);
        } else {
          console.log('No valid saved theme mode found, using system default');
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  /**
   * Watch for system color scheme changes when in system mode
   * This ensures the theme updates automatically when the user changes
   * their system appearance settings
   */
  useEffect(() => {
    // Only react to system color scheme changes if we're in system mode
    if (themeMode === THEME_MODES.SYSTEM) {
      console.log('System color scheme changed:', {
        useColorScheme: systemColorScheme,
        systemTheme: systemTheme,
        effective: effectiveSystemScheme
      });
      // Force a re-render when system color scheme changes
      // The isDark calculation will automatically pick up the new system value
    }
  }, [systemColorScheme, systemTheme, themeMode, effectiveSystemScheme]);

  /**
   * Update theme mode and persist to storage
   */
  const setThemeMode = async (mode) => {
    if (!Object.values(THEME_MODES).includes(mode)) {
      console.warn('Invalid theme mode:', mode);
      return;
    }

    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
      await logUserAction('change_theme', 'THEME_CONTEXT', { newTheme: mode, previousTheme: themeMode });
      await logger.info(`Theme mode updated to: ${mode}`, 'THEME_CONTEXT');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
      await logger.error('Failed to save theme preference', 'THEME_CONTEXT', { error: error.message, mode });
    }
  };

  const value = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    isLoading,
    systemColorScheme, // Original useColorScheme result
    systemTheme, // Processed system theme
    effectiveSystemScheme, // The one actually being used
    // Material design theme for React Native Paper
    paperTheme: theme.materialTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @returns {Object} Theme context value
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;