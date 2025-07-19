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
  try {
    console.log('🔍 Testing network connectivity...');
    
    // Get network state
    const netInfo = await NetInfo.getNetworkStateAsync();
    console.log('📡 Network State:', netInfo);
    
    // Test basic internet connectivity
    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
    console.log('🌐 Internet Connected:', isConnected);
    
    // Test server connectivity with multiple methods
    const serverUrl = 'http://118.91.235.74:80';
    console.log('🔗 Testing server connectivity to:', serverUrl);
    
    // Method 1: Simple fetch
    try {
      console.log('📡 Method 1: Simple fetch test...');
      const response = await fetch(serverUrl, {
        method: 'HEAD',
        timeout: 10000
      });
      console.log('✅ Method 1 - Server is reachable, status:', response.status);
      return { success: true, message: 'Server is reachable', method: 'fetch' };
    } catch (fetchError) {
      console.error('❌ Method 1 - Fetch failed:', fetchError.message);
      
      // Method 2: XMLHttpRequest (fallback)
      try {
        console.log('📡 Method 2: XMLHttpRequest test...');
        const xhrResult = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.timeout = 10000;
          xhr.onload = () => resolve({ status: xhr.status, statusText: xhr.statusText });
          xhr.onerror = () => reject(new Error('XHR failed'));
          xhr.ontimeout = () => reject(new Error('XHR timeout'));
          xhr.open('HEAD', serverUrl);
          xhr.send();
        });
        console.log('✅ Method 2 - XHR successful:', xhrResult);
        return { success: true, message: 'Server is reachable via XHR', method: 'xhr' };
      } catch (xhrError) {
        console.error('❌ Method 2 - XHR failed:', xhrError.message);
        
        // Method 3: Ping test (if available)
        try {
          console.log('📡 Method 3: Ping test...');
          const pingResponse = await fetch(`${serverUrl}/ping`, {
            method: 'GET',
            timeout: 5000
          });
          console.log('✅ Method 3 - Ping successful:', pingResponse.status);
          return { success: true, message: 'Server ping successful', method: 'ping' };
        } catch (pingError) {
          console.error('❌ Method 3 - Ping failed:', pingError.message);
          
          return { 
            success: false, 
            message: 'All connectivity methods failed',
            error: `Fetch: ${fetchError.message}, XHR: ${xhrError.message}, Ping: ${pingError.message}`,
            suggestions: [
              'Check if server is running on 118.91.235.74:80',
              'Verify network security configuration in app',
              'Check firewall settings',
              'Try using HTTPS instead of HTTP'
            ]
          };
        }
      }
    }
  } catch (error) {
    console.error('❌ Network test failed:', error);
    return { 
      success: false, 
      message: 'Network test failed',
      error: error.message 
    };
  }
};

export const testSpecificEndpoint = async (endpoint) => {
  try {
    const baseUrl = 'http://118.91.235.74:80';
    const fullUrl = `${baseUrl}${endpoint}`;
    
    console.log(`🔗 Testing endpoint: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'SakthiApp/1.0'
      }
    });
    
    console.log(`✅ Endpoint test successful: ${response.status}`);
    return { success: true, status: response.status, data: await response.text() };
  } catch (error) {
    console.error(`❌ Endpoint test failed: ${error.message}`);
    return { success: false, error: error.message };
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
  diagnostics.tests.health = await testSpecificEndpoint('/app/api/health');
  diagnostics.tests.otp = await testSpecificEndpoint('/app/api/auth/send-otp', 'POST', { employeeNumber: 'test123' });

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
    '/app/api/',
    '/app/api/health',
    '/app/api/auth',
    '/app/api/auth/',
    '/app/api/auth/send-otp',
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

export const getNetworkInfo = async () => {
  try {
    const netInfo = await NetInfo.getNetworkStateAsync();
    return {
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      details: netInfo.details,
      isWifi: netInfo.type === NetInfo.NetworkStateType.WIFI,
      isCellular: netInfo.type === NetInfo.NetworkStateType.CELLULAR
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return null;
  }
};

export default {
  testNetworkConnectivity,
  testSpecificEndpoint,
  getNetworkDiagnostics,
  testAllEndpoints,
  getNetworkInfo
}; 