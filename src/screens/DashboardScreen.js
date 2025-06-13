import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useDriving } from '../contexts/DrivingContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDuration, minutesToHours } from '../utils/time';
import { canUseFreezeDay, shouldSuggestFreezeDay } from '../utils/streaks';

export default function DashboardScreen({ navigation }) {
  const { 
    user, 
    drives, 
    streaks, 
    useFreezeDay,
    loading 
  } = useDriving();

  const { theme } = useTheme();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dayProgress = (user.completedDayHours / user.goalDayHours) * 100;
  const nightProgress = user.goalNightHours > 0 ? (user.completedNightHours / user.goalNightHours) * 100 : 100;
  const totalProgress = ((user.completedDayHours + user.completedNightHours) / (user.goalDayHours + user.goalNightHours)) * 100;

  const recentDrives = drives
    .slice(-3)
    .reverse()
    .map(drive => ({
      ...drive,
      durationText: formatDuration(drive.duration),
    }));

  const handleFreezeDay = () => {
    if (!canUseFreezeDay(streaks.freezeDaysThisMonth)) {
      Alert.alert(
        'Freeze Days Exhausted',
        'You\'ve used all your freeze days for this month. Freeze days reset monthly.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Use Freeze Day?',
      `This will preserve your ${streaks.current}-day streak. You have ${10 - streaks.freezeDaysThisMonth} freeze days left this month.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Freeze Day', 
          onPress: () => {
            useFreezeDay();
            Alert.alert('Streak Preserved!', 'Your streak has been preserved with a freeze day.');
          }
        }
      ]
    );
  };

  const shouldShowFreezePrompt = shouldSuggestFreezeDay(
    streaks.lastDriveDate, 
    streaks.freezeDaysThisMonth
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.text.primary }]}>Good {getTimeOfDay()}! 👋</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Ready to log some driving time?</Text>
        </View>

        {/* Freeze Day Prompt */}
        {shouldShowFreezePrompt && (
          <View style={[styles.freezePrompt, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
            <Text style={[styles.freezeTitle, { color: theme.colors.text.primary }]}>🧊 Preserve Your Streak</Text>
            <Text style={[styles.freezeText, { color: theme.colors.text.secondary }]}>
              Haven't driven in a while? Use a freeze day to preserve your {streaks.current}-day streak!
            </Text>
            <TouchableOpacity style={[styles.freezeButton, { backgroundColor: theme.colors.secondary || '#3b82f6' }]} onPress={handleFreezeDay}>
              <Text style={[styles.freezeButtonText, { color: theme.colors.text.inverse }]}>Use Freeze Day</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.startDriveButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('LogDrive')}
          >
            <Text style={styles.startDriveIcon}>🚗</Text>
            <Text style={[styles.startDriveText, { color: theme.colors.text.inverse }]}>Start Drive</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}
            onPress={() => navigation.navigate('DriveHistory')}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={[styles.quickActionText, { color: theme.colors.text.primary }]}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Your Progress</Text>
          
          {/* Total Progress */}
          <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.colors.text.primary }]}>Overall Progress</Text>
              <Text style={[styles.progressPercent, { color: theme.colors.text.primary }]}>{Math.round(totalProgress)}%</Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border.light }]}>
              <View style={[styles.progressBar, { width: `${Math.min(totalProgress, 100)}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
              {minutesToHours((user.completedDayHours + user.completedNightHours) * 60)} / {user.goalDayHours + user.goalNightHours} hours
            </Text>
          </View>

          {/* Day Hours */}
          <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.colors.text.primary }]}>☀️ Day Driving</Text>
              <Text style={[styles.progressPercent, { color: theme.colors.text.primary }]}>{Math.round(dayProgress)}%</Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border.light }]}>
              <View style={[styles.progressBar, { width: `${Math.min(dayProgress, 100)}%`, backgroundColor: theme.colors.warning || '#f59e0b' }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
              {user.completedDayHours.toFixed(1)} / {user.goalDayHours} hours
            </Text>
          </View>

          {/* Night Hours */}
          {user.goalNightHours > 0 && (
            <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: theme.colors.text.primary }]}>🌙 Night Driving</Text>
                <Text style={[styles.progressPercent, { color: theme.colors.text.primary }]}>{Math.round(nightProgress)}%</Text>
              </View>
              <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border.light }]}>
                <View style={[styles.progressBar, { width: `${Math.min(nightProgress, 100)}%`, backgroundColor: theme.colors.secondary || '#6366f1' }]} />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
                {user.completedNightHours.toFixed(1)} / {user.goalNightHours} hours
              </Text>
            </View>
          )}
        </View>

        {/* Streak Section */}
        <View style={styles.streakSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Streak Stats</Text>
          
          <View style={styles.streakCards}>
            <View style={[styles.streakCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
              <Text style={[styles.streakNumber, { color: theme.colors.primary }]}>{streaks.current}</Text>
              <Text style={[styles.streakLabel, { color: theme.colors.text.primary }]}>Current Streak</Text>
              <Text style={[styles.streakSubtext, { color: theme.colors.text.secondary }]}>🔥 days</Text>
            </View>
            
            <View style={[styles.streakCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
              <Text style={[styles.streakNumber, { color: theme.colors.primary }]}>{streaks.longest}</Text>
              <Text style={[styles.streakLabel, { color: theme.colors.text.primary }]}>Longest Streak</Text>
              <Text style={[styles.streakSubtext, { color: theme.colors.text.secondary }]}>🏆 record</Text>
            </View>
            
            <View style={[styles.streakCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
              <Text style={[styles.streakNumber, { color: theme.colors.primary }]}>{10 - streaks.freezeDaysThisMonth}</Text>
              <Text style={[styles.streakLabel, { color: theme.colors.text.primary }]}>Freeze Days</Text>
              <Text style={[styles.streakSubtext, { color: theme.colors.text.secondary }]}>🧊 remaining</Text>
            </View>
          </View>
        </View>

        {/* Recent Drives */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Recent Drives</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriveHistory')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentDrives.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
              <Text style={[styles.emptyStateText, { color: theme.colors.text.primary }]}>No drives logged yet</Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.secondary }]}>Tap "Start Drive" to begin tracking</Text>
            </View>
          ) : (
            recentDrives.map((drive, index) => (
              <View key={drive.id || index} style={[styles.driveCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border.light }]}>
                <View style={styles.driveHeader}>
                  <Text style={[styles.driveDate, { color: theme.colors.text.primary }]}>{drive.date}</Text>
                  <Text style={[styles.driveDuration, { color: theme.colors.primary }]}>{drive.durationText}</Text>
                </View>
                <Text style={[styles.driveTime, { color: theme.colors.text.secondary }]}>
                  {drive.startTime} - {drive.endTime}
                  {drive.isNightDrive && ' 🌙'}
                </Text>
                {drive.skills && (
                  <Text style={[styles.driveSkills, { color: theme.colors.text.secondary }]}>Skills: {drive.skills}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
  },
  freezePrompt: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  freezeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  freezeText: {
    fontSize: 15,
    color: '#92400e',
    marginBottom: 16,
    lineHeight: 22,
  },
  freezeButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  freezeButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  startDriveButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  startDriveIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  startDriveText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickActionButton: {
    flex: 1,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  quickActionText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '500',
  },
  streakSection: {
    marginBottom: 32,
  },
  streakCards: {
    flexDirection: 'row',
    gap: 16,
  },
  streakCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  streakSubtext: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 17,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  driveCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  driveDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
  },
  driveDuration: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  driveTime: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 6,
  },
  driveSkills: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
});
