import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { LogBox } from 'react-native';

// Import contexts
import { UserProvider, useUser } from './context/UserContext';
import { IdeaProvider, useIdeas } from './context/IdeaContext';

// Import hooks
import { useIdeaLoader } from './hooks/UserIdeaLoader';

// Import components
import CustomSplashScreen from './components/SplashScreen';

// Import screens
import LoginScreen from './pages/login';
import HomeScreen from './pages/index1';
import SubmitScreen from './pages/submit';
import TrackerScreen from './pages/tracker';
import LeaderboardScreen from './pages/leaderboard';
import ImplementedScreen from './pages/implemented';
import ProfileScreen from './pages/profile';

// Import theme
import { theme as customTheme } from './utils/theme';

// Suppress specific warnings that are not critical
LogBox.ignoreLogs([
  'Warning: useInsertionEffect must not schedule updates.',
  'Warning: Cannot update a component while rendering a different component.',
]);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Merge Paper Theme with custom colors
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...(customTheme?.colors || {}),
  },
};

// Connect User and Idea contexts
function ContextConnector() {
  const { refreshUser } = useUser();
  const { setRefreshUserCallback } = useIdeas();

  React.useEffect(() => {
    setRefreshUserCallback(refreshUser);
  }, [refreshUser, setRefreshUserCallback]);

  return null;
}

// Bottom Tab Navigator Component
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Submit') {
            iconName = 'add-circle';
          } else if (route.name === 'My Ideas') {
            iconName = 'track-changes';
          } else if (route.name === 'Leaderboard') {
            iconName = 'leaderboard';
          } else if (route.name === 'Implementation') {
            iconName = 'check-circle';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: customTheme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          borderRadius: 30,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 10, // for Android shadow
          shadowColor: '#000', // for iOS shadow
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 60,
          alignSelf: 'center',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Submit" 
        component={SubmitScreen}
        options={{
          tabBarLabel: 'Submit',
        }}
      />
      <Tab.Screen 
        name="My Ideas" 
        component={TrackerScreen}
        options={{
          tabBarLabel: 'My Ideas',
        }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'Leaderboard',
        }}
      />
      <Tab.Screen 
        name="Implementation" 
        component={ImplementedScreen}
        options={{
          tabBarLabel: 'Implementation',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Content with Authentication Logic
function AppContent() {
  const { isAuthenticated, loading } = useUser();
  const [splashFinished, setSplashFinished] = useState(false);
  
  // Initialize idea loading when user is authenticated
  useIdeaLoader();

  // Show splash screen while loading or until splash is finished
  if (loading || !splashFinished) {
    return <CustomSplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <>
      <ContextConnector />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="MainApp" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </>
  );
}

// Root App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <UserProvider>
              <IdeaProvider>
                <AppContent />
                <StatusBar style="auto" />
              </IdeaProvider>
            </UserProvider>
          </NavigationContainer>
        </PaperProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
