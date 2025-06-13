import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Modern Button Component with multiple variants
 */
export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  icon,
  style,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const getButtonStyle = () => {
    const baseStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      gap: theme.spacing.sm,
    };

    // Size variants
    const sizeStyles = {
      sm: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
      md: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
      lg: { paddingVertical: theme.spacing.xl, paddingHorizontal: theme.spacing.xxl },
    };

    // Color variants
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? theme.colors.gray[400] : theme.colors.primary,
        ...theme.shadows.colored(theme.colors.primary),
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.gray[300] : theme.colors.surface,
        borderWidth: 1,
        borderColor: disabled ? theme.colors.gray[300] : theme.colors.border.medium,
        ...theme.shadows.md,
      },
      success: {
        backgroundColor: disabled ? theme.colors.gray[400] : theme.colors.success,
        ...theme.shadows.colored(theme.colors.success),
      },
      warning: {
        backgroundColor: disabled ? theme.colors.gray[400] : theme.colors.warning,
        ...theme.shadows.colored(theme.colors.warning),
      },
      danger: {
        backgroundColor: disabled ? theme.colors.gray[400] : theme.colors.error,
        ...theme.shadows.colored(theme.colors.error),
      },
    };

    return [baseStyle, sizeStyles[size], variantStyles[variant]];
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0.5,
    };

    const sizeTextStyles = {
      sm: { fontSize: theme.typography.sizes.sm },
      md: { fontSize: theme.typography.sizes.lg },
      lg: { fontSize: theme.typography.sizes.xl },
    };

    const variantTextStyles = {
      primary: { color: theme.colors.text.inverse },
      secondary: { color: disabled ? theme.colors.gray[400] : theme.colors.text.primary },
      success: { color: theme.colors.text.inverse },
      warning: { color: theme.colors.text.inverse },
      danger: { color: theme.colors.text.inverse },
    };

    return [baseTextStyle, sizeTextStyles[size], variantTextStyles[variant]];
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      {icon && icon}
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

/**
 * Modern Card Component
 */
export const Card = ({ children, style, padding = 'lg', ...props }) => {
  const paddingStyles = {
    none: {},
    sm: { padding: spacing.lg },
    md: { padding: spacing.xl },
    lg: { padding: spacing.xxl },
    xl: { padding: spacing.xxxl },
  };

  return (
    <View
      style={[
        styles.card,
        paddingStyles[padding],
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ 
  progress, 
  color = colors.primary, 
  backgroundColor = colors.gray[200],
  height = 10,
  animated = true,
  style,
  ...props 
}) => {
  return (
    <View 
      style={[
        {
          height,
          backgroundColor,
          borderRadius: height / 2,
          overflow: 'hidden',
        },
        style
      ]}
      {...props}
    >
      <View
        style={{
          height: '100%',
          width: `${Math.min(Math.max(progress, 0), 100)}%`,
          backgroundColor: color,
          borderRadius: height / 2,
          ...shadows.colored(color, 0.3),
        }}
      />
    </View>
  );
};

/**
 * Badge Component
 */
export const Badge = ({ 
  text, 
  variant = 'primary', 
  size = 'md',
  style,
  ...props 
}) => {
  const sizeStyles = {
    sm: { 
      paddingHorizontal: spacing.sm, 
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    md: { 
      paddingHorizontal: spacing.md, 
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    lg: { 
      paddingHorizontal: spacing.lg, 
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
    },
  };

  const variantStyles = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    success: { backgroundColor: colors.success },
    warning: { backgroundColor: colors.warning },
    danger: { backgroundColor: colors.error },
    light: { backgroundColor: colors.gray[100] },
  };

  const textSizeStyles = {
    sm: { fontSize: typography.sizes.xs },
    md: { fontSize: typography.sizes.sm },
    lg: { fontSize: typography.sizes.base },
  };

  const textColorStyles = {
    primary: { color: colors.white },
    secondary: { color: colors.white },
    success: { color: colors.white },
    warning: { color: colors.white },
    danger: { color: colors.white },
    light: { color: colors.text.primary },
  };

  return (
    <View
      style={[
        sizeStyles[size],
        variantStyles[variant],
        style
      ]}
      {...props}
    >
      <Text style={[
        textSizeStyles[size],
        textColorStyles[variant],
        { fontWeight: typography.weights.medium }
      ]}>
        {text}
      </Text>
    </View>
  );
};

/**
 * Section Header Component
 */
export const SectionHeader = ({ 
  title, 
  subtitle, 
  action,
  style,
  ...props 
}) => {
  return (
    <View style={[styles.sectionHeader, style]} {...props}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && action}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
});

export default {
  Button,
  Card,
  ProgressBar,
  Badge,
  SectionHeader,
};
