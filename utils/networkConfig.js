import { Platform } from 'react-native';

// Network configuration for different environments
export const NETWORK_CONFIG = {
  // Development environment
  development: {
    // Try these fallback URLs in order
    baseURLs: [
      'http://10.232.76.142:3000',  // Your computer's local IP
      'http://10.232.76.142:3000',  // Duplicated for retry reliability
      'http://10.232.76.142:3000',       // Android Emulator localhost
    ],
    timeout: 30000,  // 30 seconds timeout
    retryAttempts: 3,  // Increased retry attempts
    retryDelay: 1000,  // 1 second between retries
    debug: true,  // Enable debug logging
  },
  
  // Production environment
  production: {
    baseURLs: ['http://10.232.76.142:3000'],
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000,
  }
};

// Get current environment
export const getCurrentEnvironment = () => {
  // You can modify this logic based on your build configuration
  if (__DEV__) {
    return 'development';
  }
  return 'production';
};

// Get network configuration for current environment
export const getNetworkConfig = () => {
  const env = getCurrentEnvironment();
  const config = NETWORK_CONFIG[env] || NETWORK_CONFIG.production;
  
  // For development, try multiple base URLs
  if (env === 'development') {
    return {
      ...config,
      // Use the first working URL or fall back to the first one
      baseURL: config.baseURLs[0],
      // Keep all URLs for retry logic if needed
      baseURLs: config.baseURLs
    };
  }
  
  // For production/staging, use the first URL
  return {
    ...config,
    baseURL: config.baseURLs[0]
  };
};

// Platform-specific network settings
export const PLATFORM_NETWORK_CONFIG = {
  android: {
    usesCleartextTraffic: true,
    networkSecurityConfig: {
      domainConfig: [
        {
          domain: '118.91.235.74',
          cleartextTrafficPermitted: true,
        }
      ]
    }
  },
  ios: {
    allowsArbitraryLoads: true,
    exceptionDomains: {
      '118.91.235.74': {
        allowsInsecureHTTPLoads: true,
        minimumTLSVersion: '1.0',
        requiresForwardSecrecy: false
      }
    }
  }
};

// Debug network information
export const debugNetworkInfo = () => {
  const config = getNetworkConfig();
  const platform = Platform.OS;
};

export default {
  NETWORK_CONFIG,
  getCurrentEnvironment,
  getNetworkConfig,
  PLATFORM_NETWORK_CONFIG,
  debugNetworkInfo
}; 