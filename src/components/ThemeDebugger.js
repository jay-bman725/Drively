import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Card, Badge, Text, Button } from './UI';

/**
 * ThemeDebugger component
 * Displays current theme properties for debugging purposes
 * Shows colors, spacing, typography, and other theme elements
 */
const ThemeDebugger = () => {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const [activeSection, setActiveSection] = useState('colors');

  // Helper function to cycle through theme modes
  const cycleThemeMode = () => {
    const modes = Object.values(THEME_MODES);
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  // Helper function to render color swatches
  const renderColorSwatches = () => {
    const colors = theme.colors;
    const swatches = [];
    
    // Main colors
    ['primary', 'primaryDark', 'primaryLight', 'secondary', 'secondaryDark', 'secondaryLight', 
     'accent', 'accentDark', 'accentLight', 'success', 'warning', 'error', 'info'].forEach(key => {
      if (typeof colors[key] === 'string') {
        swatches.push(
          <ColorSwatch 
            key={key} 
            name={key} 
            color={colors[key]} 
          />
        );
      }
    });
    
    // Text colors
    if (colors.text) {
      Object.keys(colors.text).forEach(key => {
        swatches.push(
          <ColorSwatch 
            key={`text.${key}`} 
            name={`text.${key}`} 
            color={colors.text[key]} 
          />
        );
      });
    }
    
    // Background & surface colors
    ['background', 'surface', 'surfaceSecondary'].forEach(key => {
      if (typeof colors[key] === 'string') {
        swatches.push(
          <ColorSwatch 
            key={key} 
            name={key} 
            color={colors[key]} 
          />
        );
      }
    });
    
    // Border colors
    if (colors.border) {
      Object.keys(colors.border).forEach(key => {
        swatches.push(
          <ColorSwatch 
            key={`border.${key}`} 
            name={`border.${key}`} 
            color={colors.border[key]} 
          />
        );
      });
    }
    
    // Gray scale
    if (colors.gray) {
      Object.keys(colors.gray).forEach(key => {
        swatches.push(
          <ColorSwatch 
            key={`gray.${key}`} 
            name={`gray.${key}`} 
            color={colors.gray[key]} 
          />
        );
      });
    }
    
    return (
      <View style={styles.swatchContainer}>
        {swatches}
      </View>
    );
  };
  
  // Helper function to render spacing previews
  const renderSpacingPreviews = () => {
    const spacings = theme.spacing;
    return (
      <View style={styles.spacingContainer}>
        {Object.entries(spacings).map(([key, value]) => (
          <View key={key} style={styles.spacingItem}>
            <Text>{key}: {value}px</Text>
            <View 
              style={{
                width: value,
                height: value,
                backgroundColor: theme.colors.primary,
                marginTop: 4,
              }} 
            />
          </View>
        ))}
      </View>
    );
  };
  
  // Helper function to render typography previews
  const renderTypographyPreviews = () => {
    return (
      <View style={styles.typographyContainer}>
        <Text style={styles.sectionTitle}>Font Sizes</Text>
        {Object.entries(theme.typography.sizes).map(([key, value]) => (
          <Text key={key} style={{ fontSize: value, marginVertical: 4 }}>
            {key}: {value}px
          </Text>
        ))}
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Font Weights</Text>
        {Object.entries(theme.typography.weights).map(([key, value]) => (
          <Text key={key} style={{ fontWeight: value, marginVertical: 4 }}>
            {key}: {value}
          </Text>
        ))}
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Paper Variants</Text>
        <Text variant="displayLarge">Display Large</Text>
        <Text variant="displayMedium">Display Medium</Text>
        <Text variant="displaySmall">Display Small</Text>
        
        <Text variant="headlineLarge">Headline Large</Text>
        <Text variant="headlineMedium">Headline Medium</Text>
        <Text variant="headlineSmall">Headline Small</Text>
        
        <Text variant="titleLarge">Title Large</Text>
        <Text variant="titleMedium">Title Medium</Text>
        <Text variant="titleSmall">Title Small</Text>
        
        <Text variant="bodyLarge">Body Large</Text>
        <Text variant="bodyMedium">Body Medium</Text>
        <Text variant="bodySmall">Body Small</Text>
        
        <Text variant="labelLarge">Label Large</Text>
        <Text variant="labelMedium">Label Medium</Text>
        <Text variant="labelSmall">Label Small</Text>
      </View>
    );
  };
  
  // Helper function to render component previews
  const renderComponentPreviews = () => {
    return (
      <View style={styles.componentsContainer}>
        <Text style={styles.sectionTitle}>Buttons</Text>
        <View style={styles.componentRow}>
          <Button title="Primary" variant="primary" style={styles.componentItem} />
          <Button title="Secondary" variant="secondary" style={styles.componentItem} />
        </View>
        <View style={styles.componentRow}>
          <Button title="Success" variant="success" style={styles.componentItem} />
          <Button title="Warning" variant="warning" style={styles.componentItem} />
        </View>
        <View style={styles.componentRow}>
          <Button title="Danger" variant="danger" style={styles.componentItem} />
          <Button title="Disabled" disabled style={styles.componentItem} />
        </View>
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Badge</Text>
        <View style={styles.componentRow}>
          <Badge text="Primary" variant="primary" style={styles.badge} />
          <Badge text="Secondary" variant="secondary" style={styles.badge} />
          <Badge text="Success" variant="success" style={styles.badge} />
          <Badge text="Warning" variant="warning" style={styles.badge} />
          <Badge text="Danger" variant="danger" style={styles.badge} />
        </View>
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Cards</Text>
        <Card title="Card Title" subtitle="Card Subtitle" style={{ marginBottom: 10 }}>
          <Text style={{ marginBottom: 10 }}>This is a sample card with title and subtitle.</Text>
        </Card>
        
        <Card style={{ marginBottom: 10 }}>
          <Text style={{ marginBottom: 10 }}>This is a sample card without title.</Text>
        </Card>
      </View>
    );
  };
  
  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'colors':
        return renderColorSwatches();
      case 'spacing':
        return renderSpacingPreviews();
      case 'typography':
        return renderTypographyPreviews();
      case 'components':
        return renderComponentPreviews();
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Theme Debugger</Text>
        <Badge 
          text={isDark ? 'Dark' : 'Light'} 
          variant={isDark ? 'primary' : 'secondary'} 
        />
      </View>
      
      <Button
        title={`Theme Mode: ${themeMode.toUpperCase()}`}
        onPress={cycleThemeMode}
        style={styles.themeToggle}
      />
      
      <View style={styles.tabs}>
        {['colors', 'spacing', 'typography', 'components'].map(section => (
          <TouchableOpacity
            key={section}
            style={[
              styles.tab,
              activeSection === section && styles.activeTab,
              { borderColor: theme.colors.primary }
            ]}
            onPress={() => setActiveSection(section)}
          >
            <Text
              style={{
                color: activeSection === section ? theme.colors.primary : theme.colors.text.primary,
              }}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {renderContent()}
    </ScrollView>
  );
};

// Color swatch component
const ColorSwatch = ({ name, color }) => {
  const { theme } = useTheme();
  
  // Calculate contrast color for text (simplified)
  const getContrastColor = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance (simplified)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };
  
  const textColor = color.startsWith('#') 
    ? getContrastColor(color) 
    : theme.colors.text.primary;
  
  return (
    <View style={styles.swatch}>
      <View 
        style={[
          styles.swatchColor,
          { backgroundColor: color }
        ]}
      >
        <Text style={{ color: textColor, fontSize: 10 }}>
          {color}
        </Text>
      </View>
      <Text style={styles.swatchName}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  themeToggle: {
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  swatchContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  swatch: {
    width: '30%',
    marginBottom: 16,
    marginRight: '3%',
  },
  swatchColor: {
    height: 60,
    borderRadius: 4,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchName: {
    fontSize: 12,
  },
  spacingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  spacingItem: {
    width: '22%',
    marginRight: '3%',
    marginBottom: 16,
  },
  typographyContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  componentsContainer: {
    marginBottom: 16,
  },
  componentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  componentItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  badge: {
    marginRight: 8,
  }
});

export default ThemeDebugger;
