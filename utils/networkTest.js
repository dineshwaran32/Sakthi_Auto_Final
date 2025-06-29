import * as NetInfo from 'expo-network';
import api from './api';
import { getNetworkConfig } from './networkConfig';

export const testServerConnectivity = async () => {
  console.log('🧪 Testing Server Connectivity...');
  
  try {
    const config = getNetworkConfig();
    console.log('📡 Testing connection to:', config.baseURL);
    
    // Test basic server response
    const response = await fetch(config.baseURL, {
      method: 'GET',
      timeout: 10000
    });
    
    console.log('✅ Server Response Status:', response.status);
    console.log('✅ Server Response Headers:', response.headers);
    
    const text = await response.text();
    console.log('✅ Server Response Body:', text);
    
    return {
      success: true,
      message: 'Server is reachable',
      status: response.status,
      body: text
    };
    
  } catch (error) {
    console.error('❌ Server Connectivity Test Failed:', error);
    
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

export const testNetworkConnectivity = async () => {
  console.log('🧪 Starting Network Connectivity Test...');
  
  try {
    // Test 1: Basic network info
    const netInfo = await NetInfo.getNetworkStateAsync();
    console.log('📡 Network Info:', {
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      isWifi: netInfo.type === NetInfo.NetworkStateType.WIFI,
      isCellular: netInfo.type === NetInfo.NetworkStateType.CELLULAR,
      details: netInfo
    });

    if (!netInfo.isConnected) {
      throw new Error('Device is not connected to any network');
    }

    if (!netInfo.isInternetReachable) {
      throw new Error('Internet is not reachable');
    }

    // Test 2: Network configuration
    const config = getNetworkConfig();
    console.log('⚙️ Network Config:', config);

    // Test 3: Server connectivity
    const serverTest = await testServerConnectivity();
    if (!serverTest.success) {
      throw new Error(`Server connectivity failed: ${serverTest.message}`);
    }

    // Test 4: Simple API ping (skip if health endpoint doesn't exist)
    console.log('🌐 Testing API connectivity...');
    try {
      const response = await api.get('/api/health', { timeout: 10000 });
      console.log('✅ API Health Check Response:', response.data);
    } catch (healthError) {
      console.log('⚠️ Health endpoint not available, but server is reachable');
    }

    // Test 5: Test OTP endpoint (without sending actual OTP)
    console.log('📱 Testing OTP endpoint...');
    try {
      const otpTestResponse = await api.post('/api/auth/send-otp', { 
        employeeNumber: 'test123' 
      }, { timeout: 15000 });
      console.log('✅ OTP Endpoint Test Response:', otpTestResponse.data);
    } catch (otpError) {
      console.log('❌ OTP Endpoint Test Failed:', otpError.message);
      throw new Error(`OTP endpoint not available: ${otpError.message}`);
    }

    return {
      success: true,
      message: 'All network tests passed',
      networkInfo: netInfo,
      config: config,
      serverTest: serverTest
    };

  } catch (error) {
    console.error('❌ Network Test Failed:', error);
    
    return {
      success: false,
      message: error.message,
      error: error,
      networkInfo: await NetInfo.getNetworkStateAsync(),
      config: getNetworkConfig()
    };
  }
};

export const testSpecificEndpoint = async (endpoint, method = 'GET', data = null) => {
  console.log(`🧪 Testing specific endpoint: ${method} ${endpoint}`);
  
  try {
    const config = {
      method: method.toLowerCase(),
      url: endpoint,
      timeout: 15000
    };

    if (data) {
      config.data = data;
    }

    const response = await api.request(config);
    console.log(`✅ ${endpoint} Test Success:`, response.data);
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error) {
    console.error(`❌ ${endpoint} Test Failed:`, error);
    
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

export const getNetworkDiagnostics = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: require('react-native').Platform.OS,
    isDev: __DEV__,
    networkInfo: await NetInfo.getNetworkStateAsync(),
    config: getNetworkConfig(),
    tests: {}
  };

  // Run basic connectivity test
  diagnostics.tests.connectivity = await testNetworkConnectivity();
  
  // Test specific endpoints
  diagnostics.tests.health = await testSpecificEndpoint('/api/health');
  diagnostics.tests.otp = await testSpecificEndpoint('/api/auth/send-otp', 'POST', { employeeNumber: 'test123' });

  console.log('🔍 Network Diagnostics:', diagnostics);
  return diagnostics;
};

export const testAllEndpoints = async () => {
  console.log('🧪 Testing All Possible Endpoints...');
  
  const config = getNetworkConfig();
  const baseURL = config.baseURL;
  
  const endpoints = [
    '/',
    '/api',
    '/api/',
    '/api/health',
    '/api/auth',
    '/api/auth/',
    '/api/auth/send-otp',
    '/auth',
    '/auth/send-otp',
    '/health',
    '/status'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${baseURL}${endpoint}`);
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'GET',
        timeout: 5000
      });
      
      const text = await response.text();
      results.push({
        endpoint,
        status: response.status,
        success: response.ok,
        body: text.substring(0, 200) // First 200 chars
      });
      
      console.log(`✅ ${endpoint}: ${response.status} - ${text.substring(0, 100)}`);
      
    } catch (error) {
      results.push({
        endpoint,
        status: 'ERROR',
        success: false,
        body: error.message
      });
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  return {
    success: results.some(r => r.success),
    results,
    baseURL
  };
};

export default {
  testNetworkConnectivity,
  testSpecificEndpoint,
  getNetworkDiagnostics,
  testAllEndpoints
}; 