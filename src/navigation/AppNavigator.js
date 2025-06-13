import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { logUserAction } from '../utils/logger';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LogDriveScreen from '../screens/LogDriveScreen';
import DriveHistoryScreen from '../screens/DriveHistoryScreen';
import ExportScreen from '../screens/ExportScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Context
import { useDriving } from '../contexts/DrivingContext';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab icon component
function TabIcon({ children, focused, theme }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      backgroundColor: focused ? theme.colors.primary : 'transparent',
      borderRadius: 16,
      marginBottom: 4,
    }}>
      <Text style={{ 
        fontSize: 18, 
        color: focused ? theme.colors.text.inverse : theme.colors.text.light
      }}>
        {children}
      </Text>
    </View>
  );
}

// Main tab navigator
function MainTabs() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;
          
          switch (route.name) {
            case 'Dashboard':
              iconName = '🏠';
              break;
            case 'LogDrive':
              iconName = '🚗';
              break;
            case 'DriveHistory':
              iconName = '📝';
              break;
            case 'Settings':
              iconName = '⚙️';
              break;
            default:
              iconName = '•';
          }
          
          return <TabIcon focused={focused} theme={theme}>{iconName}</TabIcon>;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.light,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          paddingBottom: 12,
          paddingTop: 12,
          height: 72,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border.light,
          borderBottomWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 4,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text.primary,
          letterSpacing: -0.3,
        },
        headerTintColor: theme.colors.primary,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="LogDrive" 
        component={LogDriveScreen}
        options={{
          title: 'Log Drive',
          tabBarLabel: 'Log Drive',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="DriveHistory" 
        component={DriveHistoryScreen}
        options={{
          title: 'Drive History',
          tabBarLabel: 'History',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// Main app navigator
function AppNavigator() {
  const { user, loading } = useDriving();
  const { theme } = useTheme();

  if (loading) {
    // You could show a loading screen here
    return null;
  }

  // Navigation state change handler for logging
  const handleNavigationStateChange = (state) => {
    if (state) {
      const currentRoute = getCurrentRouteName(state);
      if (currentRoute) {
        logUserAction('navigation', currentRoute);
      }
    }
  };

  return (
    <NavigationContainer onStateChange={handleNavigationStateChange}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border.light,
            borderBottomWidth: 1,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text.primary,
          },
          headerTintColor: theme.colors.primary,
          headerBackTitleVisible: false,
        }}
      >
        {!user.onboardingComplete ? (
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Export" 
              component={ExportScreen}
              options={{ 
                title: 'Export & Share',
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Helper function to get the current route name
function getCurrentRouteName(state) {
  const route = state.routes[state.index];
  
  if (route.state) {
    // Recursive call for nested navigators
    return getCurrentRouteName(route.state);
  }
  
  return route.name;
}

export default AppNavigator;
