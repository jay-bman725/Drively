import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Debug component to show current theme state
 * Useful for troubleshooting theme detection issues
 */
export default function ThemeDebugger() {
  const { 
    themeMode, 
    isDark, 
    systemColorScheme, 
    systemTheme, 
    effectiveSystemScheme 
  } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Theme Debug Info</Text>
      <Text style={styles.info}>Theme Mode: {themeMode}</Text>
      <Text style={styles.info}>Is Dark: {isDark ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>useColorScheme: {systemColorScheme || 'null'}</Text>
      <Text style={styles.info}>System Theme: {systemTheme || 'null'}</Text>
      <Text style={styles.info}>Effective: {effectiveSystemScheme || 'null'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});
