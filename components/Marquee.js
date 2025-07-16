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
  const containerWidth = width - 32; // Account for horizontal margins
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
        // Restart animation when app comes to foreground
        startAnimation();
      } else if (nextAppState === 'background') {
        // Clean up animation when app goes to background
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
    // Filter and sort implemented ideas by creation date (newest first)
    const recentImplementedIdeas = ideas
      .filter(idea => idea.status === 'implemented' || idea.status === 'implementing')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5); // Show only the 5 most recent

    if (recentImplementedIdeas.length > 0) {
      // Format the text with emojis and styling
      const formattedIdeas = recentImplementedIdeas.map(idea => {
        const emoji = idea.status === 'implemented' ? '✅' : '🔄';
        const date = idea.updatedAt ? new Date(idea.updatedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : '';
        return `${emoji} ${idea.title} (${idea.submittedBy?.name || user?.name || 'Team Member'}) ${date}`;
      });
      
      // Add a header and join all ideas with more spacing
      const header = '✨ Recently Implemented: ';
      const separator = '   •••••   ';
      let text = header + formattedIdeas.join(separator);
      
      // Repeat the content to ensure it's long enough
      text = text + separator + text; // Repeat once to make it longer
      setMarqueeText(text);
    } else {
      // Make the fallback message longer by repeating it
      const fallback = '✨ No recently implemented ideas yet. Be the first to contribute! ';
      setMarqueeText(fallback + fallback);
    }
  }, [ideas]);

  const startAnimation = useCallback(() => {
    if (!marqueeText || textWidth <= 0) return;

    // Stop any existing animation
    if (animation.current) {
      animation.current.stop();
    }

    // Calculate duration based on text width and container width
    const baseDuration = 20000; // Increased base duration for slower scrolling
    const speedFactor = 30; // Reduced speed factor for slower movement
    const duration = Math.max(baseDuration, (textWidth / speedFactor) * 1000);

    // Reset position to right side
    animatedValue.setValue(containerWidth);

    // Create a single animation sequence
    const animate = () => {
      // Reset position to right side
      animatedValue.setValue(containerWidth);
      
      // Start the animation
      Animated.timing(animatedValue, {
        toValue: -textWidth,
        duration: duration,
        useNativeDriver: true,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          // When animation completes, start it again
          requestAnimationFrame(animate);
        }
      });
    };

    // Start the animation loop
    animation.current = {
      stop: () => animatedValue.stopAnimation()
    };
    
    // Initial delay before starting
    setTimeout(() => {
      animate();
    }, 100);
  }, [marqueeText, textWidth, containerWidth]);

  // Handle animation when text or dimensions change
  useEffect(() => {
    if (isFocused && marqueeText && textWidth > 0) {
      startAnimation();
    }
  }, [marqueeText, textWidth, isFocused, startAnimation]);

  // Handle focus/blur events for navigation
  useEffect(() => {
    if (isFocused && marqueeText && textWidth > 0) {
      startAnimation();
    } else if (!isFocused && animation.current) {
      animation.current.stop();
    }
  }, [isFocused, marqueeText, textWidth, startAnimation]);

  // Don't show anything if there's no marquee text
  if (!marqueeText) return null;

  return (
    <View style={styles.container}>
      <View style={styles.marqueeContainer}>
        <Animated.Text 
          style={[
            styles.marqueeText,
            {
              transform: [{ translateX: animatedValue }],
              width: 'auto',
              paddingLeft: 16, // Add padding to ensure text appears from the right edge
            }
          ]}
          numberOfLines={1}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setTextWidth(width);
          }}
        >
          {marqueeText}
        </Animated.Text>
        {/* Invisible text to measure the actual width */}
        <Text 
          style={[styles.marqueeText, { opacity: 0, position: 'absolute' }]}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
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
    marginLeft: 0,
    marginRight: 0,
    marginHorizontal: 0,
    borderRadius: 8, // Match profile card's border radius
    borderTopLeftRadius: 8, // Match profile card's top corners
    borderTopRightRadius: 8, // Match profile card's top corners
    borderBottomLeftRadius: 8, // Match profile card's bottom corners
    borderBottomRightRadius: 8, // Match profile card's bottom corners
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Match the exact width of the screen minus the ScrollView's padding
    width: Dimensions.get('window').width - (spacing.md * 2), // Account for ScrollView padding
    alignSelf: 'center', // Center the marquee within the ScrollView
    marginTop: 8, // Add a small gap between profile card and marquee
    marginBottom: 4, // Add some bottom margin for better spacing
  },
  marqueeContainer: {
    overflow: 'hidden',
    width: '100%',
  },
  marqueeText: {
    color: colors.onPrimary,
    fontSize: 14,
    whiteSpace: 'nowrap',
    fontWeight: '500',
    paddingHorizontal: 20, // Increased padding for better spacing
    lineHeight: 22, // Better line height for readability
    letterSpacing: 0.3, // Slightly increased letter spacing for better readability
  },
});

export default Marquee;
