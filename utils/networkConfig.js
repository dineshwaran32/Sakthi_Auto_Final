import { Platform } from 'react-native';

// Network configuration for different environments
export const NETWORK_CONFIG = {
  // Development environment
  development: {
    baseURL: 'http://118.91.235.74:80',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  // Production environment
  production: {
    baseURL: 'http://118.91.235.74:80',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000,
  },
  
  // Staging environment (if needed)
  staging: {
    baseURL: 'http://118.91.235.74:80',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1500,
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
  return NETWORK_CONFIG[env] || NETWORK_CONFIG.production;
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
  
  console.log('🌐 Network Configuration:', {
    environment: getCurrentEnvironment(),
    platform,
    baseURL: config.baseURL,
    timeout: config.timeout,
    isDev: __DEV__,
    platformConfig: PLATFORM_NETWORK_CONFIG[platform]
  });
};

export default {
  NETWORK_CONFIG,
  getCurrentEnvironment,
  getNetworkConfig,
  PLATFORM_NETWORK_CONFIG,
  debugNetworkInfo
}; 