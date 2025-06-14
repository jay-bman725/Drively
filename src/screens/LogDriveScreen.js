import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useDriving } from '../contexts/DrivingContext';
import { useTheme } from '../contexts/ThemeContext';
import { logUserAction, logPerformance, logError } from '../utils/logger';
import { 
  getCurrentTime, 
  getCurrentDate, 
  isNightTime, 
  calculateDuration,
  formatTimeForDisplay,
  formatDateForDisplay 
} from '../utils/time';
import { fetchWeatherData, autoSelectWeatherOption } from '../utils/weather';

const WEATHER_OPTIONS = [
  '☀️ Clear',
  '🌙 Clear Night', 
  '⛅ Partly Cloudy',
  '☁️ Cloudy', 
  '🌧️ Rain',
  '🌨️ Snow',
  '🌫️ Fog',
  '💨 Windy',
];

const COMMON_SKILLS = [
  'Parallel Parking',
  'Highway Driving',
  'Night Driving',
  'City Driving',
  'Parking',
  'Lane Changes',
  'Merging',
  'Intersections',
  'Backing Up',
  'Three-Point Turn',
];

// Restricted license destinations
const DESTINATIONS = {
  allowed: [
    'School',
    'Work',
    'Medical Appointment',
    'Religious Activity',
    'Family Emergency',
    'Driver Education',
  ],
  forbidden: [
    'Friend\'s House',
    'Shopping/Mall',
    'Restaurant',
    'Movies/Entertainment',
    'Sports Event',
    'Party/Social Event',
    'Beach/Park (Recreation)',
    'Other Recreation',
  ]
};

// Scene types for the multi-step flow
const SCENES = {
  SUPERVISOR: 'supervisor',
  DESTINATION: 'destination',
  WEATHER: 'weather',
  TIMER: 'timer',
  SKILLS: 'skills'
};

export default function LogDriveScreen({ navigation }) {
  const { addDrive, settings, user } = useDriving();
  const { theme } = useTheme();
  
  // Scene flow state
  const [currentScene, setCurrentScene] = useState(SCENES.SUPERVISOR);
  
  // Drive tracking state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [realStartTime, setRealStartTime] = useState(null); // Actual timestamp for calculations
  const [pausedTime, setPausedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Drive details
  const [date, setDate] = useState(getCurrentDate());
  const [endTime, setEndTime] = useState('');
  const [weather, setWeather] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [skills, setSkills] = useState([]);
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorAge, setSupervisorAge] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationType, setDestinationType] = useState('');
  const [requiresSupervisor, setRequiresSupervisor] = useState(false);
  
  // Loading states
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Fixed timer effect - using proper timestamp comparison
  useEffect(() => {
    let interval;
    if (isActive && !isPaused && realStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - realStartTime - pausedTime;
        setElapsedTime(Math.max(0, elapsed));
      }, 100); // Update more frequently for smoother display
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, realStartTime, pausedTime]);

  // Get user location and weather when component mounts
  useEffect(() => {
    requestLocationAndWeather();
  }, []);

  const requestLocationAndWeather = async () => {
    try {
      setLoadingLocation(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'We need location access to get weather data for your drive log.',
          [{ text: 'OK' }]
        );
        setLoadingLocation(false);
        return;
      }

      // Get current location
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(locationResult);
      
      // Get weather data
      await fetchWeatherDataForLocation(locationResult.coords.latitude, locationResult.coords.longitude);
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get your location. You can manually select weather conditions.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchWeatherDataForLocation = async (lat, lon) => {
    try {
      setLoadingWeather(true);
      
      // Get temperature unit from settings
      const units = settings.temperatureUnit || 'metric';
      
      // Use the new weather API
      const weatherInfo = await fetchWeatherData(lat, lon, units);
      
      setWeatherData(weatherInfo);
      
      // Auto-select weather option based on data
      const selectedWeather = autoSelectWeatherOption(weatherInfo.description, weatherInfo.isNight);
      setWeather(selectedWeather);
      
      if (weatherInfo.isFallback) {
        Alert.alert(
          'Weather Service Unavailable',
          'Could not get current weather data. Please manually select the weather conditions.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Error fetching weather:', error);
      logError(error, 'WEATHER', 'Failed to fetch weather data');
      
      // Set default fallback
      const units = settings.temperatureUnit || 'metric';
      const tempUnit = units === 'imperial' ? '°F' : '°C';
      const fallbackTemp = units === 'imperial' ? '68' : '20';
      
      const fallbackWeather = {
        location: 'Unknown Location',
        description: 'weather data unavailable',
        temperature: `${fallbackTemp} ${tempUnit}`,
        visibility: null,
        isNight: false,
        isFallback: true
      };
      setWeatherData(fallbackWeather);
      setWeather('☀️ Clear');
      
      Alert.alert(
        'Weather Error',
        'Unable to get weather data. Please manually select conditions.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleSupervisorNext = () => {
    // Validate supervisor information if required
    if ((user.licenseType === 'learners' || requiresSupervisor) && (!supervisorName?.trim() || !supervisorAge?.trim())) {
      Alert.alert('Missing Information', 'Please enter supervisor name and age.');
      return;
    }
    
    if (supervisorAge && parseInt(supervisorAge.trim()) < 21) {
      Alert.alert('Invalid Age', 'Supervising adult must be at least 21 years old.');
      return;
    }
    
    // Validate supervisor name format
    if (supervisorName && supervisorName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter a valid supervisor name.');
      return;
    }
    
    setCurrentScene(SCENES.DESTINATION);
  };

  const handleDestinationNext = () => {
    if (!destination) {
      Alert.alert('Missing Information', 'Please select your destination.');
      return;
    }
    
    setCurrentScene(SCENES.WEATHER);
  };

  const handleWeatherNext = () => {
    setCurrentScene(SCENES.TIMER);
  };

  const handleStartDrive = () => {
    const currentTime = getCurrentTime();
    const now = Date.now();
    
    logUserAction('start_drive', 'LOG_DRIVE');
    logPerformance('drive_start_time', Date.now() - now, 'LOG_DRIVE');
    
    setStartTime(currentTime);
    setRealStartTime(now);
    setIsActive(true);
    setElapsedTime(0);
    setPausedTime(0);
  };

  const handlePause = () => {
    logUserAction('pause_drive', 'LOG_DRIVE');
    setIsPaused(true);
  };

  const handleResume = () => {
    if (isPaused && realStartTime) {
      logUserAction('resume_drive', 'LOG_DRIVE');
      // Add the pause duration to total paused time
      const pauseDuration = Date.now() - (realStartTime + elapsedTime + pausedTime);
      setPausedTime(prev => prev + pauseDuration);
      setIsPaused(false);
    }
  };

  const handleStopDrive = () => {
    if (!isActive) return;

    logUserAction('stop_drive', 'LOG_DRIVE');
    
    setIsActive(false);
    setIsPaused(false);
    const currentEndTime = getCurrentTime();
    setEndTime(currentEndTime);
    
    setCurrentScene(SCENES.SKILLS);
  };

  const handleSkillsSubmit = () => {
    // Calculate actual driving duration in minutes
    const actualDurationMs = elapsedTime;
    const actualDurationMinutes = Math.max(1, Math.floor(actualDurationMs / 60000));
    
    // Determine if it's a night drive
    const isNight = isNightTime(startTime, settings.nightTimeStart, settings.nightTimeEnd) ||
      isNightTime(endTime, settings.nightTimeStart, settings.nightTimeEnd);

    // Create drive object with sanitized data
    const driveData = {
      id: Date.now().toString(),
      date,
      startTime,
      endTime,
      duration: actualDurationMinutes,
      isNightDrive: isNight,
      weather: weather || null,
      weatherData: weatherData || null,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : null,
      skills: skills.length > 0 ? skills.join(', ') : null,
      supervisorName: supervisorName && supervisorName.trim() ? supervisorName.trim() : null,
      supervisorAge: supervisorAge && supervisorAge.trim() ? parseInt(supervisorAge.trim()) : null,
      destination: destination || null,
      destinationType: destinationType || null,
      pausedTime: Math.floor(pausedTime / 60000), // Store paused time in minutes
    };

    // Save the drive
    addDrive(driveData);

    logUserAction('save_drive', 'LOG_DRIVE', {
      durationMinutes: actualDurationMinutes,
      isNightDrive: isNight,
      hasLocation: !!location,
      hasWeather: !!weather,
      skillsCount: skills.length,
      hasSupervisor: !!(supervisorName && supervisorName.trim())
    });

    // Show success message
    const durationHours = Math.floor(actualDurationMinutes / 60);
    const durationMins = actualDurationMinutes % 60;
    const durationText = durationHours > 0 
      ? `${durationHours}h ${durationMins}m` 
      : `${durationMins}m`;
    
    Alert.alert(
      'Drive Saved! 🎉',
      `Great job! You drove for ${durationText}${isNight ? ' at night' : ''}.`,
      [
        { 
          text: 'View Dashboard', 
          onPress: () => navigation.navigate('Dashboard') 
        },
        { 
          text: 'Log Another', 
          onPress: resetForm 
        }
      ]
    );
  };

  const resetForm = () => {
    setCurrentScene(SCENES.SUPERVISOR);
    setIsActive(false);
    setIsPaused(false);
    setStartTime(null);
    setRealStartTime(null);
    setEndTime('');
    setElapsedTime(0);
    setPausedTime(0);
    setDate(getCurrentDate());
    setWeather('');
    setSkills([]);
    setSupervisorName('');
    setSupervisorAge('');
    setDestination('');
    setDestinationType('');
    setRequiresSupervisor(false);
    setWeatherData(null);
    setLoadingWeather(false);
  };

  const formatElapsedTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // Scene render functions
  const renderSupervisorScene = () => (
    <View style={[styles.sceneContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
      <Text style={[styles.sceneTitle, { color: theme.colors.text.primary }]}>Who's supervising your drive?</Text>
      <Text style={[styles.sceneSubtitle, { color: theme.colors.text.secondary }]}>
        {user.licenseType === 'learners' 
          ? 'A licensed adult must supervise all drives with a learner\'s permit.'
          : 'Required for restricted license holders in certain situations.'
        }
      </Text>

      {user.licenseType === 'restricted' && (
        <View style={styles.inputContainer}>
          <View style={[styles.switchContainer, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light }]}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Driving with supervision required?</Text>
            <Switch
              value={requiresSupervisor}
              onValueChange={setRequiresSupervisor}
              trackColor={{ false: theme.colors.border.light, true: theme.colors.primary + '50' }}
              thumbColor={requiresSupervisor ? theme.colors.primary : theme.colors.gray[300]}
            />
          </View>
        </View>
      )}

      {(user.licenseType === 'learners' || requiresSupervisor) && (
        <>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Supervisor Name *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light, color: theme.colors.text.primary }]}
              value={supervisorName}
              onChangeText={(text) => setSupervisorName(text.replace(/\s+/g, ' ').trim())}
              placeholder="Enter supervisor's name"
              placeholderTextColor={theme.colors.text.light}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>Supervisor Age *</Text>
            <TextInput
              style={[styles.textInput, styles.ageInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light, color: theme.colors.text.primary }]}
              value={supervisorAge}
              onChangeText={(text) => setSupervisorAge(text.replace(/[^0-9]/g, ''))}
              placeholder="Age"
              placeholderTextColor={theme.colors.text.light}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={[styles.helpText, { color: theme.colors.text.secondary }]}>Must be at least 21 years old</Text>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSupervisorNext}
      >
        <Text style={[styles.nextButtonText, { color: theme.colors.text.inverse }]}>Next →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDestinationScene = () => (
    <View style={[styles.sceneContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
      <Text style={[styles.sceneTitle, { color: theme.colors.text.primary }]}>Where are you going?</Text>
      <Text style={[styles.sceneSubtitle, { color: theme.colors.text.secondary }]}>
        {user.licenseType === 'restricted' 
          ? 'Some destinations may require supervision with a restricted license.'
          : 'Let us know your destination for logging purposes.'
        }
      </Text>

      <View style={styles.destinationContainer}>
        <Text style={[styles.destinationSectionTitle, { color: theme.colors.text.primary }]}>✅ Allowed Destinations</Text>
        {DESTINATIONS.allowed.map((dest) => (
          <TouchableOpacity
            key={dest}
            style={[
              styles.destinationOption,
              { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light },
              destination === dest && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
            ]}
            onPress={() => {
              setDestination(dest);
              setDestinationType('allowed');
              setRequiresSupervisor(false);
            }}
          >
            <Text style={[
              styles.destinationText,
              { color: theme.colors.text.primary },
              destination === dest && { color: theme.colors.primary, fontWeight: '600' },
            ]}>
              {dest}
            </Text>
          </TouchableOpacity>
        ))}

        {user.licenseType === 'restricted' && (
          <>
            <Text style={[styles.destinationSectionTitle, { color: theme.colors.text.primary }]}>⚠️ Restricted Destinations</Text>
            <Text style={[styles.restrictionNote, { color: theme.colors.text.secondary }]}>
              These destinations require adult supervision with a restricted license
            </Text>
            {DESTINATIONS.forbidden.map((dest) => (
              <TouchableOpacity
                key={dest}
                style={[
                  styles.destinationOption,
                  styles.restrictedDestination,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light },
                  destination === dest && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                ]}
                onPress={() => {
                  setDestination(dest);
                  setDestinationType('forbidden');
                  setRequiresSupervisor(true);
                }}
              >
                <Text style={[
                  styles.destinationText,
                  { color: theme.colors.text.primary },
                  destination === dest && { color: theme.colors.primary, fontWeight: '600' },
                ]}>
                  {dest}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity
          style={[
            styles.destinationOption,
            { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light },
            destination === 'Other' && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
          ]}
          onPress={() => {
            setDestination('Other');
            setDestinationType('other');
          }}
        >
          <Text style={[
            styles.destinationText,
            { color: theme.colors.text.primary },
            destination === 'Other' && { color: theme.colors.primary, fontWeight: '600' },
          ]}>
            Other
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton, 
          { backgroundColor: destination ? theme.colors.primary : theme.colors.gray[400] }
        ]}
        onPress={handleDestinationNext}
        disabled={!destination}
      >
        <Text style={[styles.nextButtonText, { color: theme.colors.text.inverse }]}>Next →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeatherScene = () => (
    <View style={[styles.sceneContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
      <Text style={[styles.sceneTitle, { color: theme.colors.text.primary }]}>Current Weather Conditions</Text>
      <Text style={[styles.sceneSubtitle, { color: theme.colors.text.secondary }]}>
        We've detected the weather at your location. You can adjust if needed.
      </Text>

      {loadingWeather ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>Getting weather data...</Text>
        </View>
      ) : (
        <>
          {weatherData && (
            <View style={[styles.weatherDataContainer, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light }]}>
              <Text style={[styles.weatherDataText, { color: theme.colors.primary }]}>
                📍 {weatherData.location}
              </Text>
              <Text style={[styles.weatherDataText, { color: theme.colors.text.secondary }]}>
                🌤️ {weatherData.description}
              </Text>
              <Text style={[styles.weatherDataText, { color: theme.colors.text.secondary }]}>
                🌡️ Temperature: {weatherData.temperature}
              </Text>
              {weatherData.visibility && (
                <Text style={[styles.weatherDataText, { color: theme.colors.text.secondary }]}>
                  �️ Visibility: {weatherData.visibility}
                </Text>
              )}
              {weatherData.precipitationNextHour !== null && weatherData.precipitationNextHour > 0 && (
                <Text style={[styles.weatherDataText, { color: theme.colors.text.secondary }]}>
                  🌧️ Rain expected: {weatherData.precipitationNextHour}mm in next hour
                </Text>
              )}
              {weatherData.isFallback && (
                <Text style={[styles.weatherDataText, { color: theme.colors.warning }]}>
                  ⚠️ Using fallback data - service unavailable
                </Text>
              )}
            </View>
          )}

          <View style={styles.weatherContainer}>
            {WEATHER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.weatherOption,
                  { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light },
                  weather === option && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setWeather(weather === option ? '' : option)}
              >
                <Text style={[
                  styles.weatherOptionText,
                  { color: theme.colors.text.primary },
                  weather === option && { color: theme.colors.text.inverse, fontWeight: '600' },
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleWeatherNext}
      >
        <Text style={[styles.nextButtonText, { color: theme.colors.text.inverse }]}>Start Drive →</Text>
      </TouchableOpacity>

      {/* Refresh weather button */}
      <TouchableOpacity
        style={[styles.refreshButton, { backgroundColor: theme.colors.gray[500] }]}
        onPress={() => {
          if (location) {
            fetchWeatherDataForLocation(location.coords.latitude, location.coords.longitude);
          } else {
            requestLocationAndWeather();
          }
        }}
        disabled={loadingWeather}
      >
        <Text style={[styles.refreshButtonText, { color: theme.colors.text.inverse }]}>
          {loadingWeather ? '🔄 Updating...' : '🔄 Refresh Weather'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTimerScene = () => (
    <View style={[styles.sceneContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
      <Text style={[styles.sceneTitle, { color: theme.colors.text.primary }]}>Drive Timer</Text>
      <Text style={[styles.sceneSubtitle, { color: theme.colors.text.secondary }]}>
        {isActive ? 'Drive in progress...' : 'Ready to start your drive?'}
      </Text>

      {/* Timer Display */}
      <View style={[styles.timerContainer, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light }]}>
        <Text style={[styles.timerText, { color: theme.colors.primary }]}>
          {formatElapsedTime(elapsedTime)}
        </Text>
        
        {isActive && (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: theme.colors.text.secondary }]}>
              Started at {formatTimeForDisplay(startTime)}
              {isPaused && ' (Paused)'}
            </Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isActive ? (
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleStartDrive}
          >
            <Text style={[styles.startButtonText, { color: theme.colors.text.inverse }]}>🚗 Start Drive</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            {!isPaused ? (
              <TouchableOpacity 
                style={[styles.pauseButton, { backgroundColor: theme.colors.warning || '#f59e0b' }]}
                onPress={handlePause}
              >
                <Text style={[styles.pauseButtonText, { color: theme.colors.text.inverse }]}>⏸️ Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.resumeButton, { backgroundColor: theme.colors.success || '#10b981' }]}
                onPress={handleResume}
              >
                <Text style={[styles.resumeButtonText, { color: theme.colors.text.inverse }]}>▶️ Resume</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.stopButton, { backgroundColor: theme.colors.error || '#dc2626' }]}
              onPress={handleStopDrive}
            >
              <Text style={[styles.stopButtonText, { color: theme.colors.text.inverse }]}>🛑 Stop Drive</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Drive Summary */}
      <View style={[styles.driveSummaryContainer, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Drive Summary</Text>
        <Text style={[styles.summaryText, { color: theme.colors.text.secondary }]}>📅 Date: {formatDateForDisplay(date)}</Text>
        <Text style={[styles.summaryText, { color: theme.colors.text.secondary }]}>👥 Supervisor: {supervisorName ? `${supervisorName} (${supervisorAge})` : 'None'}</Text>
        <Text style={[styles.summaryText, { color: theme.colors.text.secondary }]}>📍 Destination: {destination}</Text>
        <Text style={[styles.summaryText, { color: theme.colors.text.secondary }]}>🌤️ Weather: {weather}</Text>
      </View>
    </View>
  );

  const renderSkillsScene = () => (
    <View style={[styles.sceneContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
      <Text style={[styles.sceneTitle, { color: theme.colors.text.primary }]}>What did you practice?</Text>
      <Text style={[styles.sceneSubtitle, { color: theme.colors.text.secondary }]}>
        Select the skills you practiced during this drive.
      </Text>

      <View style={styles.skillsContainer}>
        {COMMON_SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill}
            style={[
              styles.skillChip,
              { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light },
              skills.includes(skill) && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            ]}
            onPress={() => skills.includes(skill) ? removeSkill(skill) : addSkill(skill)}
          >
            <Text style={[
              styles.skillChipText,
              { color: theme.colors.text.primary },
              skills.includes(skill) && { color: theme.colors.text.inverse, fontWeight: '600' },
            ]}>
              {skills.includes(skill) ? `✓ ${skill}` : `+ ${skill}`}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={[
            styles.skillChip,
            { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border.light },
            skills.includes('N/A') && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
          ]}
          onPress={() => skills.includes('N/A') ? removeSkill('N/A') : setSkills(['N/A'])}
        >
          <Text style={[
            styles.skillChipText,
            { color: theme.colors.text.primary },
            skills.includes('N/A') && { color: theme.colors.text.inverse, fontWeight: '600' },
          ]}>
            {skills.includes('N/A') ? '✓ N/A - Just drove' : 'N/A - Just drove'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.finalButtonsContainer}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.success || '#10b981' }]}
          onPress={handleSkillsSubmit}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.text.inverse }]}>Save Drive 💾</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border.light }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((Object.values(SCENES).indexOf(currentScene) + 1) / Object.values(SCENES).length) * 100}%`,
                  backgroundColor: theme.colors.primary
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
            Step {Object.values(SCENES).indexOf(currentScene) + 1} of {Object.values(SCENES).length}
          </Text>
        </View>

        {/* Render current scene */}
        {currentScene === SCENES.SUPERVISOR && renderSupervisorScene()}
        {currentScene === SCENES.DESTINATION && renderDestinationScene()}
        {currentScene === SCENES.WEATHER && renderWeatherScene()}
        {currentScene === SCENES.TIMER && renderTimerScene()}
        {currentScene === SCENES.SKILLS && renderSkillsScene()}

        {/* Back button for all scenes except first and timer */}
        {currentScene !== SCENES.SUPERVISOR && currentScene !== SCENES.TIMER && (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}
            onPress={() => {
              const scenes = Object.values(SCENES);
              const currentIndex = scenes.indexOf(currentScene);
              if (currentIndex > 0) {
                setCurrentScene(scenes[currentIndex - 1]);
              }
            }}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.text.secondary }]}>← Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  // Progress bar styles
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Scene container styles
  sceneContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  sceneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sceneSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
  },
  // Input styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ageInput: {
    width: 100,
    marginTop: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  // Destination styles
  destinationContainer: {
    marginBottom: 20,
  },
  destinationSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  restrictionNote: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  destinationOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  restrictedDestination: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  selectedDestination: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  destinationText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDestinationText: {
    color: 'white',
    fontWeight: '600',
  },
  // Weather styles
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  weatherDataContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  weatherDataText: {
    fontSize: 16,
    color: '#0369a1',
    marginBottom: 4,
  },
  weatherContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weatherOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: 'white',
  },
  selectedWeatherOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  weatherOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  selectedWeatherOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  // Timer styles
  timerContainer: {
    backgroundColor: '#f8fafc',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3b82f6',
    fontFamily: 'monospace',
    letterSpacing: -2,
  },
  statusContainer: {
    marginTop: 12,
  },
  statusText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  controlsContainer: {
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Drive summary styles
  driveSummaryContainer: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 6,
  },
  // Skills styles
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  skillChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  selectedSkillChip: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  skillChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedSkillChipText: {
    color: 'white',
    fontWeight: '600',
  },
  // Button styles
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  backButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  finalButtonsContainer: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#64748b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
