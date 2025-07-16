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

// Enhanced network connectivity check
const checkNetworkAndMakeRequest = async (config) => {
  try {
    const netInfo = await NetInfo.getNetworkStateAsync();
    
    console.log('📡 Network Status:', {
      isConnected: netInfo.isConnected,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      isWifi: netInfo.type === NetInfo.NetworkStateType.WIFI,
      isCellular: netInfo.type === NetInfo.NetworkStateType.CELLULAR,
      details: netInfo.details
    });
    
    if (!netInfo.isConnected) {
      throw new Error('No internet connection. Please check your network settings.');
    }
    
    if (!netInfo.isInternetReachable) {
      throw new Error('Internet is not reachable. Please try again.');
    }
    
    // Test connectivity to the server with a simple ping
    try {
      console.log('🔗 Testing server connectivity...');
      const testResponse = await fetch(`${config.baseURL}`, { 
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'SakthiApp/1.0'
        }
      });
      console.log('✅ Server connectivity test passed, status:', testResponse.status);
    } catch (testError) {
      console.warn('⚠️ Server connectivity test failed:', testError.message);
      console.log('🔍 This might be due to network security policies in production builds');
      // Don't throw here, let the actual request try
    }
    
    return config;
  } catch (error) {
    console.error('❌ Network check failed:', error);
    throw error;
  }
};

// Attach token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('🚀 Making API request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers
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
      console.error('🌐 Network error detected. This might be due to:');
      console.error('1. Network security policies blocking HTTP traffic');
      console.error('2. Server not reachable from production build');
      console.error('3. Firewall or network restrictions');
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

// Upload image to server and return the image URL
export async function uploadImageAsync(uri) {
  let uriParts = uri.split('.');
  let fileType = uriParts[uriParts.length - 1];

  let formData = new FormData();
  formData.append('photo', {
    uri,
    name: `photo.${fileType}`,
    type: `image/${fileType}`,
  });

  // Use your backend's upload endpoint (should be /upload)
  const response = await fetch(`${networkConfig.baseURL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Image upload failed:', response.status, text);
    throw new Error('Image upload failed');
  }
  const data = await response.json();
  return data.imageUrl; // The server should return { imageUrl: "https://..." }
}

export default api; 