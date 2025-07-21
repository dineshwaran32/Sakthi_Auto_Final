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
    
    if (!netInfo.isConnected) {
      throw new Error('No internet connection. Please check your network settings.');
    }
    
    if (!netInfo.isInternetReachable) {
      throw new Error('Internet is not reachable. Please try again.');
    }
    
    // Test connectivity to the server with a simple ping
    try {
      const testResponse = await fetch(`${config.baseURL}`, { 
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'SakthiApp/1.0'
        }
      });
    } catch (testError) {
      // Don't throw here, let the actual request try
    }
    
    return config;
  } catch (error) {
    throw error;
  }
};

// Attach token to every request
api.interceptors.request.use(
  async (config) => {
    try {
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
      } else {
        // No token found for request
      }
    } catch (error) {
      throw error;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
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
      const retryAfter = error.response.headers['retry-after'] || 60; // Default to 60 seconds
      
      // Wait for the specified time before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry the request
      return api.request(error.config);
    }
    
    if (error.response?.status === 401) {
      // Clear invalid tokens
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (clearError) {
        // Error clearing tokens
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

  // Use your backend's upload endpoint (should be /app/upload)
  const response = await fetch(`${networkConfig.baseURL}/app/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error('Image upload failed');
  }
  const data = await response.json();
  return data.imageUrl; // The server should return { imageUrl: "https://..." }
}

export default api; 