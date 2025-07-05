import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const CustomSplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const hideSplash = async () => {
      // Simulate some loading time or wait for actual data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Hide the splash screen
      await SplashScreen.hideAsync();
      
      // Call the onFinish callback
      if (onFinish) {
        onFinish();
      }
    };

    hideSplash();
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/splash-icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Sakthi Spark</Text>
        <Text style={styles.tagline}>Continuous Improvement Platform</Text>
        <ActivityIndicator 
          size="large" 
          color="#007AFF" 
          style={styles.loader}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});

export default CustomSplashScreen; 