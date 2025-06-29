import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NetInfo from 'expo-network';
import { getNetworkConfig, debugNetworkInfo } from './networkConfig';

// Get network configuration for current environment
const networkConfig = getNetworkConfig();

// Debug network configuration on app start
debugNetworkInfo();

const api = axios.create({
  baseURL: networkConfig.baseURL,
  timeout: networkConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Check network connectivity before making requests
const checkNetworkAndMakeRequest = async (config) => {
  const netInfo = await NetInfo.getNetworkStateAsync();
  
  console.log('📡 Network Status:', {
    isConnected: netInfo.isConnected,
    isInternetReachable: netInfo.isInternetReachable,
    type: netInfo.type,
    isWifi: netInfo.type === NetInfo.NetworkStateType.WIFI,
    isCellular: netInfo.type === NetInfo.NetworkStateType.CELLULAR
  });
  
  if (!netInfo.isConnected) {
    throw new Error('No internet connection. Please check your network settings.');
  }
  
  if (!netInfo.isInternetReachable) {
    throw new Error('Internet is not reachable. Please try again.');
  }
  
  return config;
};

// Attach token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('🚀 Making API request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      });
      
      // Check network connectivity first
      await checkNetworkAndMakeRequest(config);
      
      // Try to get token from AsyncStorage first
      let token = await AsyncStorage.getItem('token');
      
      // If not found, try to get from user data
      if (!token) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          token = user.token;
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token attached to request:', config.url);
      } else {
        console.warn('⚠️  No token found for request:', config.url);
      }
    } catch (error) {
      console.error('❌ Error in request interceptor:', error);
      throw error;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('🚨 API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.code,
      fullError: error
    });
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    // Handle rate limiting with retry logic
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limited - will retry after delay');
      const retryAfter = error.response.headers['retry-after'] || 60; // Default to 60 seconds
      
      // Wait for the specified time before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry the request
      return api.request(error.config);
    }
    
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized - clearing tokens');
      // Clear invalid tokens
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (clearError) {
        console.error('Error clearing tokens:', clearError);
      }
    }
    
    // Provide more specific error messages
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Service not found. Please contact support.');
    }
    
    return Promise.reject(error);
  }
);

export default api; 