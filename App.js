import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrivingProvider } from './src/contexts/DrivingContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeLogger, logger, logError } from './src/utils/logger';
import { scheduleLogCleanup } from './src/utils/storage';

function AppContent() {
  const { theme, isDark, isLoading } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Initialize logger when app starts
  useEffect(() => {
    const setupLogger = async () => {
      try {
        await initializeLogger();
        await logger.info('App started successfully', 'APP_STARTUP');
        
        // Schedule automatic log cleanup
        await scheduleLogCleanup();
        await logger.info('Log cleanup scheduler initialized', 'APP_STARTUP');
        
        // Set up global error handler
        const originalHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler(async (error, isFatal) => {
          try {
            await logError(error, 'GLOBAL_ERROR', { isFatal });
          } catch (logErr) {
            console.error('Failed to log error:', logErr);
          }
          
          // Call original handler
          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
        
      } catch (error) {
        console.error('Failed to initialize logger:', error);
      }
    };
    
    setupLogger();
  }, []);
  
  // Use theme colors for padding
  const paddingColor = theme.colors.background;

  // Don't render until theme is loaded to prevent theme flashing
  if (isLoading) {
    return null;
  }

  return (
    <DrivingProvider>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top padding */}
        <View style={[styles.topPadding, { backgroundColor: paddingColor, height: insets.top }]} />
        
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <View style={styles.content}>
          <AppNavigator />
        </View>
        
        {/* Bottom padding */}
        <View style={[styles.bottomPadding, { backgroundColor: paddingColor, height: insets.bottom }]} />
      </View>
    </DrivingProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  topPadding: {
    width: '100%',
  },
  bottomPadding: {
    width: '100%',
  },
});
