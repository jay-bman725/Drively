/**
 * Utility functions for accessing app information
 */
import Constants from 'expo-constants';

/**
 * Get the application version from app metadata
 * @returns {string} The current app version
 */
export function getAppVersion() {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Get the app name from app metadata
 * @returns {string} The app name
 */
export function getAppName() {
  return Constants.expoConfig?.name || 'Drively';
}
