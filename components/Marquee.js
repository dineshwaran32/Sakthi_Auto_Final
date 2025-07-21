import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useIdeas } from '../context/IdeaContext';
import { useUser } from '../context/UserContext';
import { theme, spacing } from '../utils/theme';

// Default colors in case theme is not available
const defaultColors = {
  primary: '#2196F3',
  onPrimary: '#FFFFFF'
};

// Get colors from theme or use defaults
const colors = theme?.colors || defaultColors;

const { width } = Dimensions.get('window');

const Marquee = () => {
  const { ideas = [] } = useIdeas();
  const { user } = useUser();
  const [marqueeText, setMarqueeText] = useState('');
  const [textWidth, setTextWidth] = useState(0);
  const containerWidth = width; // Use full width for maximum space
  const animatedValue = useRef(new Animated.Value(0)).current;
  const animation = useRef(null);

  const isFocused = useIsFocused();
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      setAppStateVisible(nextAppState);

      if (nextAppState === 'active') {
        startAnimation();
      } else if (nextAppState === 'background') {
        if (animation.current) {
          animation.current.stop();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [marqueeText, textWidth]);

  useEffect(() => {
    console.log('=== MARQUEE DEBUG START ===');
    console.log('Total ideas:', ideas.length);
    console.log('All ideas statuses:', ideas.map(i => ({ title: i.title, status: i.status })));
    
    const recentImplementedIdeas = ideas
      .filter(idea => {
        const isImplemented = idea.status === 'implemented' || idea.status === 'implementing';
        console.log(`Idea "${idea.title}" - Status: ${idea.status} - Included: ${isImplemented}`);
        return isImplemented;
      })
      .sort((a, b) => {
        // Sort by updatedAt for implemented ideas, fallback to createdAt
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 3); // Show only 3 most recent

    console.log('Filtered implemented ideas count:', recentImplementedIdeas.length);
    console.log('Filtered ideas:', recentImplementedIdeas.map(i => ({ title: i.title, status: i.status, updatedAt: i.updatedAt, createdAt: i.createdAt })));

    if (recentImplementedIdeas.length > 0) {
      const formattedIdeas = recentImplementedIdeas.map((idea, index) => {
        const emoji = idea.status === 'implemented' ? '✅' : '🔄';
        const date = idea.updatedAt ? new Date(idea.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }) : '';
        const submitter = idea.submittedBy?.name || user?.name || 'Team Member';
        const formatted = `${emoji} ${idea.title} (by ${submitter}) ${date}`;
        console.log(`Formatted idea ${index + 1}:`, formatted);
        return formatted;
      });

      console.log('All formatted ideas:', formattedIdeas);
      
      const header = '🎉 Latest Updates: ';
      const separator = '   •••••   '; // Clear separator for better readability
      let text = header + formattedIdeas.join(separator);
      
      console.log('Text before repetition:', text);
      
      // Always repeat the text to ensure smooth scrolling and full visibility
      text = text + separator + text;
      
      console.log('Final marquee text length:', text.length);
      console.log('Final marquee text:', text);
      console.log('=== MARQUEE DEBUG END ===');
      setMarqueeText(text);
    } else {
      console.log('No implemented ideas found, using fallback');
      const fallback = '✨ No recently implemented ideas yet. Be the first to contribute! ';
      setMarqueeText(fallback + fallback);
    }
  }, [ideas, user]);

  const startAnimation = useCallback(() => {
    if (!marqueeText) return;

    if (animation.current) {
      animation.current.stop();
    }

    // Use a much more generous fallback calculation for text width
    const effectiveTextWidth = textWidth > 0 ? textWidth * 2 : marqueeText.length * 30; // Double all width calculations
    
    console.log('Animation params:', {
      marqueeText: marqueeText.substring(0, 80) + '...',
      textWidth,
      effectiveTextWidth,
      containerWidth,
      startPosition: containerWidth + 50,
      endPosition: -effectiveTextWidth - 150
    });
    
    // Calculate duration based on total distance to travel
    const totalDistance = containerWidth + 100 + effectiveTextWidth + 300; // Double the distances
    const pixelsPerSecond = 50; // Slower speed for readability
    const duration = Math.max(30000, (totalDistance / pixelsPerSecond) * 1000);

    const animate = () => {
      // Start from well beyond the right edge
      animatedValue.setValue(containerWidth + 50);

      animation.current = Animated.timing(animatedValue, {
        toValue: -effectiveTextWidth - 300, // Double the end position for complete scrolling
        duration: duration,
        useNativeDriver: true,
      });

      animation.current.start(({ finished }) => {
        if (finished) {
          // Add a pause before restarting
          setTimeout(() => {
            requestAnimationFrame(animate);
          }, 1500);
        }
      });
    };

    // Start animation after a brief delay
    setTimeout(() => {
      animate();
    }, 300);
  }, [marqueeText, textWidth, containerWidth]);

  useEffect(() => {
    if (isFocused && marqueeText && textWidth > 0) {
      startAnimation();
    } else if (!isFocused && animation.current) {
      animation.current.stop();
    }
  }, [isFocused, marqueeText, textWidth, startAnimation]);

  if (!marqueeText) return null;

  return (
    <View style={styles.container}>
      <View style={styles.marqueeContainer}>
        <Animated.Text
          style={[
            styles.marqueeText,
            {
              transform: [{ translateX: animatedValue }],
              width: textWidth > 0 ? (textWidth + 200) * 2 : marqueeText.length * 40 + 800, // Double the width calculations
              position: 'absolute', // Absolute positioning to avoid container constraints
              top: 0,
              left: 0,
            }
          ]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {marqueeText}
        </Animated.Text>
        {/* Hidden text for accurate width measurement */}
        <Text
          style={[
            styles.marqueeText,
            {
              opacity: 0,
              position: 'absolute',
              top: -2000, // Move far off screen
              left: -2000, // Also move horizontally off screen
              paddingHorizontal: 16, // Match the visible text padding for accurate measurement
              maxWidth: 'none', // Allow unlimited width for measurement
            }
          ]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            console.log('Text width measured:', width, 'for text:', marqueeText.substring(0, 90) + '...');
            setTextWidth(width);
          }}
        >
          {marqueeText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: Dimensions.get('window').width - 8, // Minimal margins for maximum space
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    marginHorizontal: 4, // Small horizontal margins
  },
  marqueeContainer: {
    overflow: 'hidden',
    width: '100%',
    height: 30, // Fixed height to contain the text
    position: 'relative', // Relative positioning for absolute children
  },
  marqueeText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.3,
    paddingHorizontal: 16, // Consistent padding
    flexShrink: 0, // Prevent text from shrinking
    flexWrap: 'nowrap', // Prevent text wrapping
  },
});

export default Marquee;
