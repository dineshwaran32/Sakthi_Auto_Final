import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Paragraph,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { spacing } from '../utils/theme';
import api from '../utils/api';
import { testNetworkConnectivity, testAllEndpoints } from '../utils/networkTest';
import logo from '../assets/icon.png';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '../utils/api';

export default function LoginScreen() {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: enter emp no, 2: enter otp
  const { login, isAuthenticated } = useUser();
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: spacing.md,
      resizeMode: 'contain',
      borderRadius : 20,
    },
    subtitle: {
      fontSize: 16,
      color: '#fff',
      textAlign: 'center',
    },
    card: {
      elevation: 4,
    },
    cardTitle: {
      textAlign: 'center',
      marginBottom: spacing.lg,
      color: theme.colors.primary,
    },
    input: {
      marginBottom: spacing.md,
      backgroundColor:'#fff',
    },
    button: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    demoInfo: {
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
    },
    demoTitle: {
      fontWeight: 'bold',
      marginBottom: spacing.sm,
      color: theme.colors.onSurfaceVariant,
    },
    demoText: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
  });

  const handleSendOtp = async () => {
    if (!employeeNumber) {
      Alert.alert('Error', 'Please enter your Employee Number');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/send-otp', { employeeNumber });
      if (response.data.success) {
        setStep(2);
        Alert.alert('Success', 'OTP sent to your registered mobile number');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('Network error')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else if (error.message && error.message.includes('timeout')) {
        Alert.alert('Timeout Error', 'Request timed out. Please try again.');
      } else if (error.response?.status === 404) {
        Alert.alert('Service Error', 'OTP service is currently unavailable. Please try again later.');
      } else if (error.response?.status === 500) {
        Alert.alert('Server Error', 'Server is experiencing issues. Please try again later.');
      } else {
        Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!employeeNumber || !otp) {
      Alert.alert('Error', 'Please enter both Employee Number and OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-otp', { employeeNumber, otp });
      if (response.data.success) {
        const loginSuccess = await login(response.data);
        if (loginSuccess) {
          // Navigation will be handled automatically by the App.js component
          // when isAuthenticated becomes true
        } else {
          Alert.alert('Error', 'Failed to save login data');
        }
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
        setStep(1);
        setOtp('');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('Network error')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else if (error.message && error.message.includes('timeout')) {
        Alert.alert('Timeout Error', 'Request timed out. Please try again.');
      } else if (error.response?.status === 404) {
        Alert.alert('Service Error', 'Login service is currently unavailable. Please try again later.');
      } else if (error.response?.status === 500) {
        Alert.alert('Server Error', 'Server is experiencing issues. Please try again later.');
      } else {
        Alert.alert('Error', error.response?.data?.message || error.message || 'Unable to connect to the server. Please try again.');
      }
      setStep(1);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleDebugNetwork = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting comprehensive network debug...');
      
      // Test 1: Basic network connectivity
      const result = await testNetworkConnectivity();
      console.log('📡 Network Test Result:', result);
      
      // Test 2: All possible endpoints
      const endpointResult = await testAllEndpoints();
      console.log('🔍 Endpoint Test Result:', endpointResult);
      
      if (result.success && endpointResult.success) {
        Alert.alert('Network Test', '✅ Network connectivity is working properly!\n\nCheck console for detailed results.');
      } else {
        let errorMessage = '❌ Network issues detected:\n\n';
        if (!result.success) {
          errorMessage += `Network: ${result.message}\n`;
        }
        if (!endpointResult.success) {
          errorMessage += `Endpoints: Server not responding properly\n`;
        }
        errorMessage += '\nCheck console for detailed results.';
        Alert.alert('Network Test', errorMessage);
      }
    } catch (error) {
      console.error('Debug Error:', error);
      Alert.alert('Debug Error', `Failed to run network test: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image source={logo} style={styles.logo} />
              <Paragraph style={styles.subtitle}>
                Continuous Improvement Platform
              </Paragraph>
            </View>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="headlineSmall" style={styles.cardTitle}>
                  Sign In
                </Text>

                <TextInput
                  label="Employee Number"
                  value={employeeNumber}
                  onChangeText={setEmployeeNumber}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  editable={step === 1}
                />

                {step === 2 && (
                  <TextInput
                    label="OTP"
                    value={otp}
                    onChangeText={setOtp}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    secureTextEntry
                  />
                )}

                {step === 1 ? (
                  <Button
                    mode="contained"
                    onPress={handleSendOtp}
                    style={styles.button}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : 'Send OTP'}
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    onPress={handleVerifyOtp}
                    style={styles.button}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#FFFFFF" /> : 'Login'}
                  </Button>
                )}

                {/* Demo Credentials section removed as per request */}

                {/* Test Network Connection button removed as per request */}
              </Card.Content>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
