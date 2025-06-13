import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../utils/theme';

/**
 * Enhanced Progress Ring Component with animation
 */
export const ProgressRing = ({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  color = colors.primary,
  backgroundColor = colors.gray[200],
  showPercentage = true,
  children,
  animated = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const circleRef = useRef();
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated]);

  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View style={styles.progressRingContent}>
        {showPercentage && (
          <Text style={styles.progressPercentage}>
            {Math.round(progress)}%
          </Text>
        )}
        {children}
      </View>
      {/* This would need react-native-svg for actual implementation */}
      <View 
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]}
      />
      <View 
        style={[
          styles.progressCircle,
          styles.progressFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '-90deg' }],
          }
        ]}
      />
    </View>
  );
};

/**
 * Streak Flame Animation Component
 */
export const StreakFlame = ({ streak, animated = true }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated && streak > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    }
  }, [streak, animated]);

  const getFlameColor = () => {
    if (streak === 0) return colors.gray[400];
    if (streak < 7) return colors.warning;
    if (streak < 30) return colors.error;
    return colors.primary;
  };

  const getFlameSize = () => {
    if (streak === 0) return 24;
    if (streak < 7) return 32;
    if (streak < 30) return 40;
    return 48;
  };

  return (
    <Animated.View
      style={[
        styles.streakFlame,
        {
          transform: [{ scale: scaleAnim }],
          opacity: streak > 0 ? opacityAnim : 0.3,
        }
      ]}
    >
      <Text 
        style={[
          styles.flameEmoji,
          { 
            fontSize: getFlameSize(),
            color: getFlameColor(),
          }
        ]}
      >
        🔥
      </Text>
    </Animated.View>
  );
};

/**
 * Achievement Badge Component
 */
export const AchievementBadge = ({ 
  title, 
  description, 
  icon, 
  achieved = false,
  progress = 0,
  target = 100,
  animated = true,
}) => {
  const slideAnim = useRef(new Animated.Value(achieved ? 0 : -100)).current;
  const scaleAnim = useRef(new Animated.Value(achieved ? 1 : 0.8)).current;

  useEffect(() => {
    if (achieved && animated) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [achieved, animated]);

  return (
    <Animated.View
      style={[
        styles.achievementBadge,
        {
          opacity: achieved ? 1 : 0.6,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        }
      ]}
    >
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementEmoji}>{icon}</Text>
      </View>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementDescription}>{description}</Text>
        {!achieved && (
          <View style={styles.achievementProgress}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${(progress / target) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{target}
            </Text>
          </View>
        )}
      </View>
      {achieved && (
        <View style={styles.achievementCheck}>
          <Text style={styles.checkEmoji}>✓</Text>
        </View>
      )}
    </Animated.View>
  );
};

/**
 * Stats Grid Component
 */
export const StatsGrid = ({ stats, animated = true }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.staggered(
        200,
        stats.map((_, index) =>
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay: index * 100,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      fadeAnim.setValue(1);
    }
  }, [stats, animated]);

  return (
    <View style={styles.statsGrid}>
      {stats.map((stat, index) => (
        <Animated.View
          key={stat.label}
          style={[
            styles.statCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.statNumber}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
          {stat.change && (
            <Text style={[
              styles.statChange,
              { color: stat.change > 0 ? colors.success : colors.error }
            ]}>
              {stat.change > 0 ? '+' : ''}{stat.change}
            </Text>
          )}
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  progressRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  progressCircle: {
    position: 'absolute',
  },
  progressFill: {
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  streakFlame: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameEmoji: {
    textAlign: 'center',
  },
  achievementBadge: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  achievementCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkEmoji: {
    color: colors.white,
    fontSize: 16,
    fontWeight: typography.weights.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  statNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
  statChange: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
  },
});

export default {
  ProgressRing,
  StreakFlame,
  AchievementBadge,
  StatsGrid,
};
