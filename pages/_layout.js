import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider, useUser } from '../context/UserContext';
import { IdeaProvider, useIdeas } from '../context/IdeaContext';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { useIdeaLoader } from '../hooks/useIdeaLoader';
import { theme as customTheme } from '../utils/theme';
import { TransitionPresets } from '@react-navigation/stack';
import { LogBox } from 'react-native';
import LoginScreen from './login';

// Suppress specific warnings that are not critical
LogBox.ignoreLogs([
  'Warning: useInsertionEffect must not schedule updates.',
  'Warning: Cannot update a component while rendering a different component.',
]);

// Merge Paper Theme with custom colors
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...customTheme.colors,
  },
};

// Connect both User and Idea context
function ContextConnector() {
  const { refreshUser } = useUser();
  const { setRefreshUserCallback } = useIdeas();

  useEffect(() => {
    setRefreshUserCallback(refreshUser);
  }, [refreshUser, setRefreshUserCallback]);

  return null;
}

// This is where routing and auth gating happens
function AppContent() {
  const { isAuthenticated, loading } = useUser();

  useFrameworkReady();     // custom hook (likely loader or system check)
  useIdeaLoader();         // custom hook to preload idea data

  if (loading) {
    // Optional: you could return a splash screen here
    return null;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      <ContextConnector />
      <Stack
        screenOptions={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS, // iOS-like animation
        }}
      >
        {/* Define your route screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="submit" />
        <Stack.Screen name="tracker" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="implemented" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

// Wrap app with all providers and theming
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <UserProvider>
          <IdeaProvider>
            <AppContent />
            <StatusBar style="auto" />
          </IdeaProvider>
        </UserProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
